import { PrismaClient } from "../generated/prisma/index.js";

const sourceUrl = process.env.SOURCE_DATABASE_URL;
const targetUrl = process.env.TARGET_DATABASE_URL;

if (!sourceUrl || !targetUrl) {
  console.error(
    "Defini SOURCE_DATABASE_URL (origen) y TARGET_DATABASE_URL (destino) antes de ejecutar este comando.",
  );
  process.exit(2);
}

function describeDatabase(connectionString) {
  try {
    const url = new URL(connectionString);
    return `${url.hostname}${url.port ? `:${url.port}` : ""}/${url.pathname.slice(1)}`;
  } catch {
    return "URL invalida";
  }
}

function quoteIdentifier(identifier) {
  return `"${identifier.replaceAll('"', '""')}"`;
}

async function inspectDatabase(connectionString) {
  const db = new PrismaClient({
    datasourceUrl: connectionString,
    log: ["error"],
  });

  try {
    const tables = await db.$queryRawUnsafe(`
      select table_name
      from information_schema.tables
      where table_schema = 'public'
        and table_type = 'BASE TABLE'
      order by table_name
    `);

    const columns = await db.$queryRawUnsafe(`
      select
        table_name,
        column_name,
        ordinal_position,
        data_type,
        udt_name,
        is_nullable,
        coalesce(column_default, '') as column_default
      from information_schema.columns
      where table_schema = 'public'
      order by table_name, ordinal_position
    `);

    const rowCounts = {};
    for (const { table_name: tableName } of tables) {
      const qualifiedName = `"public".${quoteIdentifier(tableName)}`;
      const [{ count }] = await db.$queryRawUnsafe(
        `select count(*)::text as count from ${qualifiedName}`,
      );
      rowCounts[tableName] = count;
    }

    const hasPrismaMigrations = tables.some(
      ({ table_name: tableName }) => tableName === "_prisma_migrations",
    );
    const migrations = hasPrismaMigrations
      ? await db.$queryRawUnsafe(`
          select migration_name, checksum, finished_at is not null as finished
          from public._prisma_migrations
          where rolled_back_at is null
          order by migration_name
        `)
      : [];

    return {
      tables: tables.map(({ table_name: tableName }) => tableName),
      columns,
      rowCounts,
      migrations,
    };
  } finally {
    await db.$disconnect();
  }
}

function stableJson(value) {
  return JSON.stringify(value, (_key, item) =>
    typeof item === "bigint" ? item.toString() : item,
  );
}

function compareMaps(source, target) {
  const differences = [];
  const keys = [...new Set([...Object.keys(source), ...Object.keys(target)])];

  for (const key of keys.sort()) {
    if (source[key] !== target[key]) {
      differences.push({
        table: key,
        source: source[key] ?? "missing",
        target: target[key] ?? "missing",
      });
    }
  }
  return differences;
}

console.log(`Origen:  ${describeDatabase(sourceUrl)}`);
console.log(`Destino: ${describeDatabase(targetUrl)}`);

const [source, target] = await Promise.all([
  inspectDatabase(sourceUrl),
  inspectDatabase(targetUrl),
]);

const schemaMatches =
  stableJson(source.tables) === stableJson(target.tables) &&
  stableJson(source.columns) === stableJson(target.columns);
const migrationsMatch =
  stableJson(source.migrations) === stableJson(target.migrations);
const rowCountDifferences = compareMaps(source.rowCounts, target.rowCounts);

console.log(`Esquema:     ${schemaMatches ? "OK" : "DIFERENTE"}`);
console.log(`Migraciones: ${migrationsMatch ? "OK" : "DIFERENTES"}`);

if (rowCountDifferences.length === 0) {
  console.log("Filas:       OK (todos los conteos coinciden)");
} else {
  console.error("Filas:       DIFERENTES");
  console.table(rowCountDifferences);
}

if (!schemaMatches || !migrationsMatch || rowCountDifferences.length > 0) {
  process.exitCode = 1;
}
