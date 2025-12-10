// Fallback-side: denne vises bare hvis du ikke oppdaterer ruter-konfigurasjonen
// (I normaltilfelle brukes Dashboard eller annen side som hjem)
const Index = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        {/* Tittel */}
        <h1 className="mb-4 text-4xl font-bold">Welcome to Your Blank App</h1>
        {/* Undertittel */}
        <p className="text-xl text-muted-foreground">Start building your amazing project here!</p>
      </div>
    </div>
  );
};

// Eksporter komponenten
export default Index;
