import N8nChat from "@site/src/components/N8nChat";
import DocItem from "@theme-original/DocItem";
import React from 'react';

export default function DocItemWrapper(props) {
  return (
    <>
      <DocItem {...props} />
      <N8nChat />
    </>
  );
}
