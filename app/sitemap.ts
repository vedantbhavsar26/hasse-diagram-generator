import {MetadataRoute} from 'next'


export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: 'https://hasse-diagram-generator.exlaso.in',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 1,
    }
  ]
}