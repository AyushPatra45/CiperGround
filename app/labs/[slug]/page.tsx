import LabExperience from '../lab-experience';

export default async function LabPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <LabExperience slug={slug} />;
}
