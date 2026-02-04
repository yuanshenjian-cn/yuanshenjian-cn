import Link from "next/link";

export function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="border-t mt-auto">
      <div className="container mx-auto px-4 py-6">
        <div className="text-center text-sm text-muted-foreground">
          <p>
            © {currentYear}{" "}
            <Link href="/" className="hover:text-foreground transition-colors">
              Yuan Shenjian
            </Link>
            <span className="mx-2">•</span>
            <a 
              href="https://github.com/yuanshenjian-cn" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
            >
              GitHub
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
