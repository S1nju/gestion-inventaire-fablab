import Link from "next/link";

import { Button } from "@/components/ui/button";

interface ServerPaginationProps {
  basePath: string;
  currentPage: number;
  lastPage: number;
  query?: Record<string, string | undefined>;
}

function buildHref(basePath: string, query: Record<string, string | undefined>, page: number) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    if (value && value.trim() !== "" && key !== "page") {
      params.set(key, value);
    }
  }

  params.set("page", String(page));
  const queryString = params.toString();
  return queryString ? `${basePath}?${queryString}` : basePath;
}

export function ServerPagination({ basePath, currentPage, lastPage, query = {} }: ServerPaginationProps) {
  if (lastPage <= 1) {
    return null;
  }

  const previousPage = Math.max(1, currentPage - 1);
  const nextPage = Math.min(lastPage, currentPage + 1);

  return (
    <div className="flex items-center justify-end gap-2">
      {currentPage <= 1 ? (
        <Button variant="outline" size="sm" disabled>
          Precedent
        </Button>
      ) : (
        <Button asChild variant="outline" size="sm">
          <Link href={buildHref(basePath, query, previousPage)}>Precedent</Link>
        </Button>
      )}
      <span className="text-muted-foreground text-sm">
        Page {currentPage} / {lastPage}
      </span>
      {currentPage >= lastPage ? (
        <Button variant="outline" size="sm" disabled>
          Suivant
        </Button>
      ) : (
        <Button asChild variant="outline" size="sm">
          <Link href={buildHref(basePath, query, nextPage)}>Suivant</Link>
        </Button>
      )}
    </div>
  );
}
