import Link from "next/link";
import { Icon, type IconName } from "./Icon";
import { PageHeader } from "./ui";

export function BientotDisponible({ titre, icone, description }: { titre: string; icone: IconName; description: string }) {
  return (
    <div className="mx-auto max-w-[1280px]">
      <PageHeader titre={titre} />
      <div className="panel flex flex-col items-center px-6 py-16 text-center">
        <span className="grid size-14 place-items-center rounded-2xl bg-primary-soft text-primary">
          <Icon name={icone} size={26} />
        </span>
        <p className="mt-4 max-w-md text-sm text-muted">{description}</p>
        <Link href="/" className="mt-6 inline-flex h-10 items-center rounded-lg border border-line px-4 text-sm font-semibold hover:bg-surface-2">
          Retour au tableau de bord
        </Link>
      </div>
    </div>
  );
}
