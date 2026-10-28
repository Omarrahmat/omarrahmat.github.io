import type { ComponentType } from 'react';

let counter = 0;

/** Server-side wrapper: renders the component and stores its props in a JSON script so the browser can hydrate it. */
export function makeIsland(name: string, C: ComponentType<any>) {
  return function Island(props: any) {
    const id = `island-props-${++counter}`;
    const json = JSON.stringify(props).replace(/</g, '\\u003c');
    return (
      <>
        <script type="application/json" id={id} dangerouslySetInnerHTML={{ __html: json }} />
        <div data-island={name} data-props-id={id} style={{ display: 'contents' }}>
          <C {...props} />
        </div>
      </>
    );
  };
}
