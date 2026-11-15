import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

// Estilos do bloco de notas do prototipo: titulos 20px, texto #d4d4d4, codigo em JetBrains Mono.
const components: Components = {
  h1: (props) => <h2 className="mt-3 text-[22px] font-semibold tracking-[-0.01em] first:mt-0" {...props} />,
  h2: (props) => <h2 className="mt-3 text-xl font-semibold tracking-[-0.01em] first:mt-0" {...props} />,
  h3: (props) => <h3 className="mt-2 text-base font-semibold first:mt-0" {...props} />,
  h4: (props) => <h4 className="mt-2 font-semibold first:mt-0" {...props} />,
  p: (props) => <p className="leading-[1.7] text-fg-soft" {...props} />,
  ul: (props) => <ul className="list-disc pl-5 leading-[1.8] text-fg-soft" {...props} />,
  ol: (props) => <ol className="list-decimal pl-5 leading-[1.8] text-fg-soft" {...props} />,
  li: (props) => <li className="[&>ul]:mt-0 [&>ol]:mt-0" {...props} />,
  a: ({ href, ...props }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-fg underline underline-offset-4 hover:text-fg-soft"
      {...props}
    />
  ),
  blockquote: (props) => <blockquote className="border-l-2 border-line-hover pl-4 text-fg-muted" {...props} />,
  hr: () => <hr className="border-line" />,
  pre: (props) => (
    <pre
      className="my-1 overflow-x-auto rounded-md border border-line bg-code p-4 font-mono text-[13px] leading-[1.7] text-fg-soft [&_code]:border-0 [&_code]:bg-transparent [&_code]:p-0"
      {...props}
    />
  ),
  code: (props) => (
    <code className="rounded-[4px] border border-line bg-code px-1.5 py-0.5 font-mono text-[0.9em] text-fg-soft" {...props} />
  ),
  table: (props) => (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-[13px] text-fg-soft" {...props} />
    </div>
  ),
  th: (props) => <th className="border border-line px-3 py-1.5 text-left font-medium text-fg" {...props} />,
  td: (props) => <td className="border border-line px-3 py-1.5" {...props} />,
  input: (props) => <input {...props} disabled className="mr-2 accent-white" />,
  img: ({ alt }) => <span className="text-fg-muted">[imagem: {alt}]</span>,
};

export function Markdown({ content }: { content: string }) {
  return (
    <div className="flex flex-col gap-3.5">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
