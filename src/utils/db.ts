import { Prisma, PrismaClient } from "@prisma/client";

const orderExtension = Prisma.defineExtension((prisma) =>
  prisma.$extends({
    name: "orderExtension",
    query: {
      lesson: {
        async create({ args, query }) {
          const sectionId = args.data.sectionId;

          if (!args.data.order) {
            const lastLesson = await prisma.lesson.findFirst({
              where: { sectionId },
              orderBy: { order: "desc" },
              select: { order: true },
            });

            args.data.order = lastLesson ? (lastLesson.order || 0) + 1 : 1;
          }
          return query(args);
        },
      },
      section: {
        async create({ args, query }) {
          const courseId = args.data.courseId;

          if (!args.data.order) {
            const lastSection = await prisma.section.findFirst({
              where: { courseId },
              orderBy: { order: "desc" },
              select: { order: true },
            });

            args.data.order = lastSection ? (lastSection.order || 0) + 1 : 1;
          }
          return query(args);
        },
      },
    },
  })
);

const db = new PrismaClient().$extends(orderExtension);

export default db;
