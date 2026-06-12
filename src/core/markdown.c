#include "markdown.h"
#include <string.h>
#include <ctype.h>

// Very small markdown-to-plain renderer for preview.
int markdown_render_to_text(const char* md, char* out, size_t outcap) {
    if (!md || !out || outcap == 0) return -1;
    size_t oi = 0;
    const char* p = md;
    while (*p && oi + 1 < outcap) {
        // Handle headings: skip leading # and space
        if (*p == '#') {
            // skip all leading #
            while (*p == '#') p++;
            if (*p == ' ') p++;
            // copy until end of line
            while (*p && *p != '\n' && oi + 1 < outcap) out[oi++] = *p++;
            // add newline
            if (*p == '\n') p++;
            if (oi + 2 < outcap) { out[oi++] = '\n'; out[oi++] = '\n'; }
            continue;
        }

        // Code fence: skip ``` markers and copy lines verbatim
        if (p[0] == '`' && p[1] == '`' && p[2] == '`') {
            p += 3;
            // copy until closing ```
            while (*p && !(p[0]=='`' && p[1]=='`' && p[2]=='`') && oi + 1 < outcap) {
                out[oi++] = *p++;
            }
            if (p[0]=='`' && p[1]=='`' && p[2]=='`') p += 3;
            if (oi + 2 < outcap) { out[oi++] = '\n'; out[oi++] = '\n'; }
            continue;
        }

        // Links: [text](url) -> copy text
        if (*p == '[') {
            const char* start = p+1;
            const char* r = strchr(start, ']');
            if (r && r[1] == '(') {
                // copy text between [ ]
                const char* q = start;
                while (q < r && oi + 1 < outcap) out[oi++] = *q++;
                p = r + 1;
                // skip (url)
                const char* s = strchr(p, ')');
                if (s) p = s + 1;
                continue;
            }
        }

        // Wiki links [[Title]] -> Title
        if (p[0] == '[' && p[1] == '[') {
            const char* q = p + 2;
            while (*q && !(*q==']' && q[1]==']') && oi + 1 < outcap) {
                out[oi++] = *q++;
            }
            if (*q) q += 2;
            p = q;
            continue;
        }

        // Bold/italic markers: remove * and _
        if (*p == '*' || *p == '_' || *p == '`') { p++; continue; }

        // Otherwise copy char
        out[oi++] = *p++;
    }
    out[oi] = '\0';
    return (int)oi;
}
