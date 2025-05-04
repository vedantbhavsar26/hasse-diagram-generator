import type {Metadata} from 'next'
import './globals.css'


export const metadata: Metadata = {
    title: 'Hasse Diagram Generator | Poset Visualization Tool',
    description: 'Generate and visualize Hasse diagrams for partially ordered sets (posets). Create custom posets or divisibility posets with our interactive mathematical visualization tool.',
    keywords: 'hasse diagram, poset, partially ordered set, divisibility poset, mathematical visualization, discrete mathematics',
    authors: [{ name: 'Vedant Bhavsar', url: 'https://exlaso.in' }],
    creator: 'Vedant Bhavsar',
    openGraph: {
        title: 'Hasse Diagram Generator',
        description: 'Create and visualize posets and divisibility relations with interactive Hasse diagrams',
        type: 'website',
        images:[{
            url: "./logo.png"
        }]
    },

}

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode
}>) {
    return (
        <html lang="en">
        <body>{children}
        <footer className={"absolute bottom-0 w-full border-t text-primary"}>
            <div className="flex justify-between p-4">
                <p>©2025 Hasse Diagram Generator. All rights reserved.</p>
                <p>Created by <a href="https://exlaso.in" target="_blank" rel="noopener noreferrer"
                className={"underline"}
                >Vedant Bhavsar</a></p>
            </div>
        </footer>
        </body>
        </html>
    )
}
