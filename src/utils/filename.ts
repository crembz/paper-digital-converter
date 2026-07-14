export function generateFilenameFromMarkdown(md: string): string {
  const headingMatch = md.match(/^#\s+(.+)$/m);
  
  let name: string;
  
  if (headingMatch) {
    name = headingMatch[1].trim();
  } else {
    const firstLine = md.split('\n').find((line) => line.trim().length > 0) || '';
    name = firstLine.replace(/[*_`#>\-\s]/g, '').trim().slice(0, 100);
  }
  
  return name
    .replace(/[\\/:*?"<>|]/g, '')
    .replace(/\s+/g, '-')
    .toLowerCase()
    .slice(0, 100) || 'output';
}
