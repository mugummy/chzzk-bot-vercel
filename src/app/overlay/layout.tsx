export default function OverlayLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="obs-transparent min-h-screen w-full overflow-hidden bg-transparent">
      {children}
    </div>
  );
}
