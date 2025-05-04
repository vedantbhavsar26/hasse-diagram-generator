import HasseDiagramGenerator from "@/components/hasse-diagram-generator"

export default function Home() {
  return (
    <main className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6 text-center">Hasse Diagram Generator</h1>
      <p className="text-center mb-8 max-w-2xl mx-auto">
        Create Hasse diagrams for partially ordered sets (posets). Input your elements and relations, then visualize the
        diagram with automatic layout.
      </p>
      <HasseDiagramGenerator />
    </main>
  )
}
