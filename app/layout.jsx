import "./fonts.css";
export const metadata = {
  title: "Investment & Deal Sourcing | OFC",
  description: "Evidence, investment decisions and asset stewardship.",
};
export default function Layout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
