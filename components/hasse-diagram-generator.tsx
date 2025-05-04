"use client"

import {useEffect, useRef, useState} from "react"
import {Button} from "@/components/ui/button"
import {Input} from "@/components/ui/input"
import {Textarea} from "@/components/ui/textarea"
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs"
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card"
import {Label} from "@/components/ui/label"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {Download, HelpCircle, Info, Trash2} from "lucide-react"

// Types for our poset and diagram
type Element = string
type Relation = [Element, Element] // [a, b] means a < b
type PosetData = {
  elements: Element[]
  relations: Relation[]
}

type Node = {
  id: string
  level: number
  x?: number
  y?: number
}

type Edge = {
  source: string
  target: string
}

type DiagramData = {
  nodes: Node[]
  edges: Edge[]
}

export default function HasseDiagramGenerator() {
  const [elements, setElements] = useState<string>("");
  const [relations, setRelations] = useState<string>("");
  const [diagramData, setDiagramData] = useState<DiagramData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [nodeSize, setNodeSize] = useState<number>(30);
  const [levelHeight, setLevelHeight] = useState<number>(80);
  const [showLabels, setShowLabels] = useState<boolean>(true);
  const [layoutType, setLayoutType] = useState<string>("hierarchical");
  const [divisibilityNumbers, setDivisibilityNumbers] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>("general");
  const [examples, setExamples] = useState<PosetData[]>([
    {
      elements: ["a", "b", "c", "d", "e"],
      relations: [["a", "b"], ["a", "c"], ["b", "d"], ["c", "d"], ["c", "e"]]
    },
    {
      elements: ["∅", "{a}", "{b}", "{a,b}"],
      relations: [["∅", "{a}"], ["∅", "{b}"], ["{a}", "{a,b}"], ["{b}", "{a,b}"]]
    },
    {
      elements: ["1", "2", "3", "4", "6", "12"],
      relations: [["1", "2"], ["1", "3"], ["2", "4"], ["2", "6"], ["3", "6"], ["4", "12"], ["6", "12"]]
    }
  ]);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Parse input strings into poset data
  const parseInput = (): PosetData | null => {
    try {
      // Parse elements
      const parsedElements = elements
          .split(",")
          .map(e => e.trim())
          .filter(e => e.length > 0);

      if (parsedElements.length === 0) {
        setError("Please enter at least one element");
        return null;
      }

      // Parse relations
      const parsedRelations: Relation[] = [];
      const relationLines = relations.split("\n");

      for (const line of relationLines) {
        const trimmedLine = line.trim();
        if (trimmedLine.length === 0) continue;

        // Match patterns like "a < b" or "a,b"
        let match;
        if ((match = trimmedLine.match(/^(.+?)\s*<\s*(.+)$/))) {
          const [_, a, b] = match;
          if (!parsedElements.includes(a.trim()) || !parsedElements.includes(b.trim())) {
            setError(`Relation "${trimmedLine}" contains elements not in the element list`);
            return null;
          }
          parsedRelations.push([a.trim(), b.trim()]);
        } else if ((match = trimmedLine.match(/^(.+?)\s*,\s*(.+)$/))) {
          const [_, a, b] = match;
          if (!parsedElements.includes(a.trim()) || !parsedElements.includes(b.trim())) {
            setError(`Relation "${trimmedLine}" contains elements not in the element list`);
            return null;
          }
          parsedRelations.push([a.trim(), b.trim()]);
        } else {
          setError(`Invalid relation format: "${trimmedLine}"`);
          return null;
        }
      }

      setError(null);
      return {
        elements: parsedElements,
        relations: parsedRelations
      };
    } catch (err) {
      setError(`Error parsing input: ${err instanceof Error ? err.message : String(err)}`);
      return null;
    }
  };

  // Generate divisibility poset
  const generateDivisibilityPoset = () => {
    try {
      // Parse numbers
      const numbers = divisibilityNumbers
          .split(",")
          .map(n => n.trim())
          .filter(n => n.length > 0)
          .map(n => {
            const parsed = Number.parseInt(n);
            if (isNaN(parsed) || parsed <= 0) {
              throw new Error(`Invalid number: ${n}. Only positive integers are allowed.`);
            }
            return parsed.toString();
          });

      if (numbers.length === 0) {
        setError("Please enter at least one positive integer");
        return;
      }

      // Generate relations based on divisibility
      const relations: Relation[] = [];

      for (let i = 0; i < numbers.length; i++) {
        for (let j = 0; j < numbers.length; j++) {
          if (i !== j) {
            const a = Number.parseInt(numbers[i]);
            const b = Number.parseInt(numbers[j]);

            // a < b if a divides b (and a ≠ b)
            if (b % a === 0) {
              relations.push([numbers[i], numbers[j]]);
            }
          }
        }
      }

      // Update the input fields
      setElements(numbers.join(", "));
      setRelations(relations.map(([a, b]) => `${a} < ${b}`).join("\n"));

      // Generate the diagram
      const posetData: PosetData = {
        elements: numbers,
        relations: relations
      };

      // Compute Hasse diagram
      const diagram = computeHasseDiagram(posetData);

      // Compute layout
      const layoutedDiagram = computeLayout(diagram);

      setDiagramData(layoutedDiagram);
      setError(null);
    } catch (err) {
      setError(`Error generating divisibility poset: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  // Compute the transitive closure of relations
  const computeTransitiveClosure = (poset: PosetData): Set<string> => {
    const { elements, relations } = poset;

    // Initialize adjacency matrix
    const adj: Record<string, Set<string>> = {};
    for (const element of elements) {
      adj[element] = new Set<string>();
    }

    // Fill adjacency matrix with direct relations
    for (const [a, b] of relations) {
      adj[a].add(b);
    }

    // Floyd-Warshall algorithm for transitive closure
    for (const k of elements) {
      for (const i of elements) {
        for (const j of elements) {
          if (adj[i].has(k) && adj[k].has(j)) {
            adj[i].add(j);
          }
        }
      }
    }

    // Convert to set of relation strings for easy lookup
    const closure = new Set<string>();
    for (const i of elements) {
      for (const j of adj[i]) {
        closure.add(`${i},${j}`);
      }
    }

    return closure;
  };

  // Compute the Hasse diagram (transitive reduction)
  const computeHasseDiagram = (poset: PosetData): DiagramData => {
    const { elements, relations } = poset;

    // Compute transitive closure
    const transitiveClosure = computeTransitiveClosure(poset);

    // Find direct relations (edges in Hasse diagram)
    const directRelations: Relation[] = [];
    for (const [a, b] of relations) {
      let isDirect = true;

      // Check if there's an intermediate element
      for (const c of elements) {
        if (c !== a && c !== b &&
            transitiveClosure.has(`${a},${c}`) &&
            transitiveClosure.has(`${c},${b}`)) {
          isDirect = false;
          break;
        }
      }

      if (isDirect) {
        directRelations.push([a, b]);
      }
    }

    // Compute levels for each element
    const levels: Record<string, number> = {};
    const visited = new Set<string>();

    // Helper function for DFS
    const computeLevel = (element: string): number => {
      if (visited.has(element)) return levels[element];

      visited.add(element);
      let maxLevel = 0;

      for (const [a, b] of directRelations) {
        if (b === element) {
          const level = computeLevel(a);
          maxLevel = Math.max(maxLevel, level + 1);
        }
      }

      levels[element] = maxLevel;
      return maxLevel;
    };

    // Compute levels for all elements
    for (const element of elements) {
      if (!visited.has(element)) {
        computeLevel(element);
      }
    }

    // Create nodes with levels
    const nodes: Node[] = elements.map(id => ({
      id,
      level: levels[id]
    }));

    // Create edges from direct relations
    const edges: Edge[] = directRelations.map(([source, target]) => ({
      source,
      target
    }));

    return { nodes, edges };
  };

  // Compute x-coordinates for nodes to minimize edge crossings
  const computeLayout = (diagram: DiagramData): DiagramData => {
    const { nodes, edges } = diagram;

    // Group nodes by level
    const nodesByLevel: Record<number, Node[]> = {};
    const maxLevel = Math.max(...nodes.map(n => n.level));

    for (let level = 0; level <= maxLevel; level++) {
      nodesByLevel[level] = nodes.filter(n => n.level === level);
    }

    // Simple layout: distribute nodes evenly on each level
    const newNodes = [...nodes];

    if (layoutType === "hierarchical") {
      for (let level = 0; level <= maxLevel; level++) {
        const levelNodes = nodesByLevel[level];
        const levelWidth = levelNodes.length * 100;
        const startX = -levelWidth / 2 + 50;

        levelNodes.forEach((node, i) => {
          const nodeIndex = newNodes.findIndex(n => n.id === node.id);
          if (nodeIndex !== -1) {
            newNodes[nodeIndex] = {
              ...newNodes[nodeIndex],
              x: startX + i * 100,
              y: level * levelHeight
            };
          }
        });
      }
    } else if (layoutType === "circular") {
      // Circular layout
      const radius = Math.max(nodes.length * 20, 150);
      const angleStep = (2 * Math.PI) / nodes.length;

      nodes.forEach((node, i) => {
        const angle = i * angleStep;
        const nodeIndex = newNodes.findIndex(n => n.id === node.id);
        if (nodeIndex !== -1) {
          newNodes[nodeIndex] = {
            ...newNodes[nodeIndex],
            x: radius * Math.cos(angle),
            y: radius * Math.sin(angle)
          };
        }
      });
    }

    return { nodes: newNodes, edges };
  };

  // Generate the diagram
  const generateDiagram = () => {
    const posetData = parseInput();
    if (!posetData) return;

    try {
      // Compute Hasse diagram
      const diagram = computeHasseDiagram(posetData);

      // Compute layout
      const layoutedDiagram = computeLayout(diagram);

      setDiagramData(layoutedDiagram);
      setError(null);
    } catch (err) {
      setError(`Error generating diagram: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  // Draw the diagram on canvas
  useEffect(() => {
    if (!diagramData || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const padding = 50;
    let minX = Number.POSITIVE_INFINITY, maxX = Number.NEGATIVE_INFINITY, minY = Number.POSITIVE_INFINITY, maxY = Number.NEGATIVE_INFINITY;

    diagramData.nodes.forEach(node => {
      if (node.x !== undefined && node.y !== undefined) {
        minX = Math.min(minX, node.x);
        maxX = Math.max(maxX, node.x);
        minY = Math.min(minY, node.y);
        maxY = Math.max(maxY, node.y);
      }
    });

    const width = Math.max(600, maxX - minX + 2 * padding);
    const height = Math.max(400, maxY - minY + 2 * padding);

    canvas.width = width;
    canvas.height = height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Translate to center
    const translateX = width / 2;
    const translateY = padding;

    // Draw edges
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 2;

    diagramData.edges.forEach(edge => {
      const source = diagramData.nodes.find(n => n.id === edge.source);
      const target = diagramData.nodes.find(n => n.id === edge.target);

      if (source && target && source.x !== undefined && source.y !== undefined &&
          target.x !== undefined && target.y !== undefined) {
        ctx.beginPath();
        ctx.moveTo(source.x + translateX, source.y + translateY);
        ctx.lineTo(target.x + translateX, target.y + translateY);
        ctx.stroke();
      }
    });

    // Draw nodes
    diagramData.nodes.forEach(node => {
      if (node.x === undefined || node.y === undefined) return;

      // Draw circle
      ctx.fillStyle = '#4f46e5';
      ctx.beginPath();
      ctx.arc(node.x + translateX, node.y + translateY, nodeSize / 2, 0, 2 * Math.PI);
      ctx.fill();

      // Draw label
      if (showLabels) {
        ctx.fillStyle = '#fff';
        ctx.font = '14px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(node.id, node.x + translateX, node.y + translateY);
      }
    });

  }, [diagramData, nodeSize, showLabels]);

  // Load example poset
  const loadExample = (index: number) => {
    const example = examples[index];
    setElements(example.elements.join(", "));
    setRelations(example.relations.map(([a, b]) => `${a} < ${b}`).join("\n"));
  };

  // Download diagram as PNG
  const downloadDiagram = () => {
    if (!canvasRef.current) return;

    const link = document.createElement('a');
    link.download = 'hasse-diagram.png';
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
  };

  // Check if poset is a superset of another poset
  const checkSuperset = () => {
    const posetData = parseInput();
    if (!posetData) return;

    // A poset P is a superset of Q if:
    // 1. All elements in Q are in P
    // 2. All relations in Q are preserved in P

    // For this simple implementation, we'll just check if the current poset
    // contains all elements and relations from the examples
    const results = examples.map((example, index) => {
      const allElementsIncluded = example.elements.every(e =>
          posetData.elements.includes(e)
      );

      const allRelationsPreserved = example.relations.every(([a, b]) =>
          posetData.relations.some(([c, d]) => c === a && d === b)
      );

      return {
        name: `Example ${index + 1}`,
        isSuperset: allElementsIncluded && allRelationsPreserved
      };
    });

    // Display results in an alert
    setError(
        results.map(r => `${r.name}: ${r.isSuperset ? 'Yes' : 'No'}`).join('\n')
    );
  };

  return (
      <div className="space-y-6">
        <Tabs defaultValue="general" onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="general">General Poset</TabsTrigger>
            <TabsTrigger value="divisibility">Divisibility Poset</TabsTrigger>
            <TabsTrigger value="help">Help</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Input Section */}
              <Card>
                <CardHeader>
                  <CardTitle>Input</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="elements">Elements (comma separated)</Label>
                      <div className="flex space-x-2">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Info className="h-4 w-4 mr-1" />
                              Examples
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Example Posets</AlertDialogTitle>
                              <AlertDialogDescription>
                                Select an example poset to load:
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <div className="space-y-2 py-4">
                              <Button
                                  variant="outline"
                                  className="w-full justify-start"
                                  onClick={() => loadExample(0)}
                              >
                                Example 1: Simple Poset
                              </Button>
                              <Button
                                  variant="outline"
                                  className="w-full justify-start"
                                  onClick={() => loadExample(1)}
                              >
                                Example 2: Power Set of {'{a,b}'}
                              </Button>
                              <Button
                                  variant="outline"
                                  className="w-full justify-start"
                                  onClick={() => loadExample(2)}
                              >
                                Example 3: Divisibility Poset
                              </Button>
                            </div>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setElements("");
                              setRelations("");
                            }}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Clear
                        </Button>
                      </div>
                    </div>
                    <Input
                        id="elements"
                        placeholder="e.g. a, b, c, d"
                        value={elements}
                        onChange={(e) => setElements(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="relations">Relations (one per line, format: {`"a < b\\" or \\"a,b"`})</Label>
                    <Textarea
                        id="relations"
                        placeholder="e.g. a < b&#10;b < c&#10;a < d"
                        rows={6}
                        value={relations}
                        onChange={(e) => setRelations(e.target.value)}
                    />
                  </div>

                  <div className="flex justify-between">
                    <Button onClick={generateDiagram}>
                      Generate Diagram
                    </Button>
                    <Button variant="outline" onClick={checkSuperset}>
                      Check Superset
                    </Button>
                  </div>

                  {error && (
                      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                        <pre className="whitespace-pre-wrap">{error}</pre>
                      </div>
                  )}
                </CardContent>
              </Card>

              {/* Diagram Section */}
              <Card>
                <CardHeader>
                  <CardTitle>Diagram</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {diagramData ? (
                      <>
                        <div className="flex flex-col space-y-4">
                          <Button variant="outline" onClick={downloadDiagram} className="self-end">
                            <Download className="h-4 w-4 mr-2" />
                            Download PNG
                          </Button>
                        </div>

                        <div className="border rounded-md p-4 overflow-auto">
                          <canvas
                              ref={canvasRef}
                              className="mx-auto"
                          />
                        </div>
                      </>
                  ) : (
                      <div className="text-center py-12 text-gray-500">
                        <HelpCircle className="mx-auto h-12 w-12 mb-4 opacity-20" />
                        <p>Generate a diagram first to see it here</p>
                      </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="divisibility" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Divisibility Input Section */}
              <Card>
                <CardHeader>
                  <CardTitle>Divisibility Poset Generator</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="divisibilityNumbers">
                      Enter positive integers (comma separated)
                    </Label>
                    <Input
                        id="divisibilityNumbers"
                        placeholder="e.g. 1, 2, 3, 4, 6, 12"
                        value={divisibilityNumbers}
                        onChange={(e) => setDivisibilityNumbers(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm text-gray-500">
                      This will create a poset where a &lt; b if a divides b (and a ≠ b).
                    </p>
                    <p className="text-sm text-gray-500">
                      For example, in the set {'{1, 2, 3, 4, 6, 12}'}, we have relations like 1 &lt; 2 (since 1 divides 2),
                      2 &lt; 4 (since 2 divides 4), etc.
                    </p>
                  </div>

                  <Button onClick={generateDivisibilityPoset}>
                    Generate Divisibility Poset
                  </Button>

                  {error && activeTab === "divisibility" && (
                      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                        <pre className="whitespace-pre-wrap">{error}</pre>
                      </div>
                  )}
                </CardContent>
              </Card>

              {/* Diagram Section (same as in general tab) */}
              <Card>
                <CardHeader>
                  <CardTitle>Diagram</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {diagramData ? (
                      <>
                        <div className="flex flex-col space-y-4">
                          <Button variant="outline" onClick={downloadDiagram} className="self-end">
                            <Download className="h-4 w-4 mr-2" />
                            Download PNG
                          </Button>
                        </div>

                        <div className="border rounded-md p-4 overflow-auto">
                          <canvas
                              ref={canvasRef}
                              className="mx-auto"
                          />
                        </div>
                      </>
                  ) : (
                      <div className="text-center py-12 text-gray-500">
                        <HelpCircle className="mx-auto h-12 w-12 mb-4 opacity-20" />
                        <p>Generate a diagram first to see it here</p>
                      </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="help">
            <Card>
              <CardContent className="pt-6 space-y-4">
                <h2 className="text-xl font-semibold">About Hasse Diagrams</h2>
                <p>
                  A Hasse diagram is a graphical representation of a partially ordered set (poset).
                  In a Hasse diagram:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Elements of the poset are represented as nodes</li>
                  <li>If element a &lt; b in the poset and there's no element c such that a &lt; c &lt; b, then there's an edge from a to b</li>
                  <li>The diagram is drawn so that if a &lt; b, then a is drawn below b</li>
                </ul>

                <h3 className="text-lg font-semibold mt-4">How to Use This Tool</h3>
                <ol className="list-decimal pl-6 space-y-2">
                  <li>Enter the elements of your poset as a comma-separated list</li>
                  <li>Enter the relations of your poset, one per line, using either "a &lt; b" or "a,b" format</li>
                  <li>Click "Generate Diagram" to create the Hasse diagram</li>
                  <li>Use the controls to adjust the appearance of the diagram</li>
                  <li>Download the diagram as a PNG if needed</li>
                </ol>

                <h3 className="text-lg font-semibold mt-4">Divisibility Posets</h3>
                <p>
                  A divisibility poset is a special type of poset where:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Elements are positive integers</li>
                  <li>The relation a &lt; b means "a divides b" (and a ≠ b)</li>
                </ul>
                <p>
                  For example, in the set {'{1, 2, 3, 4, 6, 12}'}, we have relations like:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>1 &lt; 2 (since 1 divides 2)</li>
                  <li>2 &lt; 4 (since 2 divides 4)</li>
                  <li>3 &lt; 6 (since 3 divides 6)</li>
                  <li>etc.</li>
                </ul>
                <p>
                  The "Divisibility Poset" tab allows you to automatically generate these relations.
                </p>

                <h3 className="text-lg font-semibold mt-4">Superset of Posets</h3>
                <p>
                  A poset P is a superset of another poset Q if:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>All elements in Q are also in P</li>
                  <li>All relations in Q are preserved in P</li>
                </ul>
                <p>
                  You can use the "Check Superset" button to check if your poset is a superset of the example posets.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
  );
}
