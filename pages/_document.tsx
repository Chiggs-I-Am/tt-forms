import { Head, Html, Main, NextScript } from "next/document";

export default function Document()
{
  return (
    <Html className="dark" lang="en-GB">
      <Head />
      <body className="dark:bg-surface-dark bg-surface-light">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}