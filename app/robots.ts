import {MetadataRoute} from 'next'


export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: '*',
            allow: '/',
        },
        sitemap: 'https://hasse-diagram-generator.exlaso.in/sitemap.xml',
    }
}