import type { MDXComponents } from "mdx/types";
import type { ComponentProps } from "react";

function Pre({ title, ...props }: ComponentProps<"pre">) {
  return (
    <figure data-code-block="">
      {title ? <figcaption>{title}</figcaption> : null}
      <pre {...props} />
    </figure>
  );
}

export function getMDXComponents(components?: MDXComponents): MDXComponents {
  return { pre: Pre, ...components };
}
