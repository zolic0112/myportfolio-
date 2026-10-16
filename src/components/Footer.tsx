export default function Footer({ name }: { name: string }) {
  return (
    <footer className="border-t border-border py-8 text-center text-sm text-muted">
      © {new Date().getFullYear()} {name}
    </footer>
  );
}
