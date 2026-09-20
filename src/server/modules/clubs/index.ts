import { getClubBySlug } from "./application/use-cases/get-club-by-slug";
import { prismaClubsRepository } from "./infrastructure/persistence/prisma-clubs-repository";

export { clubsRouter } from "./presentation/router";
export type { ClubDetailDto, ClubSummaryDto } from "./application/dto/club";

export const getClubBySlugUseCase = getClubBySlug(prismaClubsRepository);





export async function listClubIdsForUser(userId: string): Promise<string[]> {
  return prismaClubsRepository.listClubIdsForUser(userId);
}
