import NameSearchReservation from "@/components/ui/form/name-search-reservation";

export default function Page() {
  return (
    <main className="[grid-area:main/fullbleed]">
      <section className="[grid-area:main]">
        <div className="mx-auto w-[min(100%,600px)] h-full">
          <NameSearchReservation />
        </div>
      </section>
    </main>
  );
}
