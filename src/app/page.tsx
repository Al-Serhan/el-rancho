import LoginButton from '@/components/LoginButton';
import EmailLogin from '@/components/EmailLogin';

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 bg-[url('/bg-desert.png')] bg-cover bg-center">
      <div className="panel-pixel max-w-xl text-center space-y-8 backdrop-blur-sm bg-rust-900/80">
        <div className="space-y-4">
          <h1 className="text-4xl md:text-6xl text-terracotta-400">El Rancho</h1>
          <p className="text-xl">
            Welcome to the frontier, partner. Stake your claim, trade your cards, and become a legend of the West.
          </p>
        </div>
        
        <div className="flex flex-col items-center">
          <LoginButton />
          <EmailLogin />
        </div>
      </div>
    </main>
  );
}
