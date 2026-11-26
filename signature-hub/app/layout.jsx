import "./styles.css";

export const metadata = {
  title: "Signature Hub",
  description: "A secure workspace for preparing, sending, and tracking signature requests.",
};

export default function RootLayout({ children }) {
  return <html lang="en"><body>{children}</body></html>;
}
