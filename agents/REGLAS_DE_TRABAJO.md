# Reglas de trabajo para agentes

## Commits

Los agentes no deben crear commits, hacer push ni modificar el historial de Git.

El commit debe realizarlo siempre Facundo manualmente, después de revisar los
cambios y decidir el mensaje correspondiente.

Cuando se solicite un commit, el agente solo debe sugerir un nombre de commit y
dejar los cambios sin confirmar.

## Migraciones

Las migraciones de Prisma deben aplicarse siempre manualmente por Facundo. Los
agentes pueden preparar o revisar los archivos de migración, pero no deben
ejecutar comandos que apliquen, reseteen o eliminen migraciones o la base de
datos.
