import { use } from 'react';

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function SomePage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const search = await searchParams;

  return (
    <div>
      <h1>Page ID: {id}</h1>
      <p>Search: {JSON.stringify(search)}</p>
    </div>
  );
}