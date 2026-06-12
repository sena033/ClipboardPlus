#ifndef MARKDOWN_H
#define MARKDOWN_H

#include <stddef.h>

// Render a minimal subset of Markdown to plain text for preview.
// out must be preallocated with capacity outcap. Returns number of bytes written (not including null) or -1 on error.
int markdown_render_to_text(const char* md, char* out, size_t outcap);

#endif // MARKDOWN_H
