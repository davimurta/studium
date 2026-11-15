import Link from "next/link";

export function Logo() {
  return (
    <Link
      href="/"
      className="flex items-center gap-2.5 rounded-md px-2.5 py-1 text-[15px] font-semibold tracking-[-0.01em]"
    >
      <span aria-hidden="true" className="block size-4 rounded-[4px] border-[1.5px] border-white" />
      Estudos
    </Link>
  );
}
