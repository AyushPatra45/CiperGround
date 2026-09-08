import Arena from '../../arena';
export default async function ChallengePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <Arena initialChallenge={id} />;
}
