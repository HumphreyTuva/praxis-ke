import { Button, useTitle } from "../components/ui.jsx";

export default function NotFound() {
  useTitle("Page not found");
  return (
    <section className="section leafy leafy--water">
      <div className="container center notfound">
        <p className="eyebrow-num">404</p>
        <h1>We couldn’t find that page</h1>
        <p className="lead">The page may have moved, or the link may be incorrect.</p>
        <div className="hero__actions" style={{ justifyContent: "center" }}>
          <Button to="/">Back to home</Button>
          <Button to="/publications" variant="outline">View publications</Button>
        </div>
      </div>
    </section>
  );
}
