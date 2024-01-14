"use client";

import NoticeOfDirectors from "@/components/ui/form/notice-of-directors";

export default function Page() {
  return (
    <main className="[grid-area:main/fullbleed]">
      <section className="[grid-area:main]">
        <div className="mx-auto grid max-w-80 gap-4">
          <NoticeOfDirectors />
        </div>
      </section>
    </main>
  );
}
