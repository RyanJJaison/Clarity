import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CourseOutline as CourseOutlineType } from "@/types/db";

export function CourseOutline({ courseId, outline }: { courseId: string; outline: CourseOutlineType }) {
  return (
    <div className="flex flex-col gap-6">
      {outline.modules.map((mod, i) => (
        <Card key={mod.title + i}>
          <CardHeader>
            <CardTitle className="text-base">
              Module {i + 1}: {mod.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {mod.lessons.map((lesson) => (
              <Link
                key={lesson.id}
                href={`/courses/${courseId}/lessons/${lesson.id}`}
                className="flex items-center justify-between rounded-md border px-3 py-2 text-sm hover:bg-muted"
              >
                <span>{lesson.title}</span>
                <span className="flex gap-1">
                  {lesson.conceptTags.slice(0, 3).map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </span>
              </Link>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
