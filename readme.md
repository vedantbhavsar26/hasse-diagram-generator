# Hasse Diagram Generator

A React-based web application for creating and visualizing Hasse diagrams of partially ordered sets (posets).

## Features

- **General Poset Creation**: Create custom posets by specifying elements and relations
- **Divisibility Poset Generator**: Automatically generate posets based on divisibility relations
- **Visualization Options**: Adjust node size, layout, and display settings
- **Examples**: Pre-loaded example posets to quickly get started
- **Download**: Export diagrams as PNG images
- **Superset Checking**: Verify if your poset is a superset of example posets

## What is a Hasse Diagram?

A Hasse diagram is a graphical representation of a partially ordered set (poset). In a Hasse diagram:

- Elements of the poset are represented as nodes
- If element a < b in the poset and there's no element c such that a < c < b, then there's an edge from a to b
- The diagram is drawn so that if a < b, then a is drawn below b

## Technologies Used

- React with TypeScript
- Next.js framework
- HTML Canvas for rendering diagrams
- shadcn/ui for UI components

## Usage

### Creating a General Poset

1. Enter elements of your poset as a comma-separated list (e.g., `a, b, c, d`)
2. Enter relations, one per line, using either `a < b` or `a,b` format
3. Click "Generate Diagram" to create the Hasse diagram

### Creating a Divisibility Poset

1. Navigate to the "Divisibility Poset" tab
2. Enter positive integers as a comma-separated list (e.g., `1, 2, 3, 4, 6, 12`)
3. Click "Generate Divisibility Poset" to create a poset where a < b if a divides b

### Examples

The application includes pre-loaded examples:
- **Example 1**: Simple Poset
- **Example 2**: Power Set of {a,b}
- **Example 3**: Divisibility Poset

## Implementation Details

The application implements several key algorithms:
- **Transitive Closure**: Using Floyd-Warshall algorithm
- **Transitive Reduction**: To compute the Hasse diagram
- **Layout Algorithms**: Hierarchical and circular layouts for visualizing posets

## Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/hasse-diagram-generator.git

# Navigate to the project directory
cd hasse-diagram-generator

# Install dependencies
npm install

# Run the development server
npm run dev