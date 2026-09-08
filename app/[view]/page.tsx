import Arena from '../arena';
import { notFound } from 'next/navigation';
const names: Record<string, string> = {
  leaderboard: 'Leaderboard',
  team: 'My team',
  submissions: 'Submissions',
  guide: 'Field guide',
  studio: 'Author studio',
  account: 'Account',
};
export default async function View({
  params,
}: {
  params: Promise<{ view: string }>;
}) {
  const { view } = await params;
  if (!names[view]) notFound();
  return <Arena initialPage={names[view]} />;
}
