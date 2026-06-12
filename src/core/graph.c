#include "graph.h"
#include <string.h>
#include <stdlib.h>

int md_graph_parse(const char* content, md_graph_t* out) {
    if (!content || !out) return -1;
    out->nodes = NULL;
    out->count = 0;

    const char* p = content;
    while (*p) {
        // find [[
        if (p[0] == '[' && p[1] == '[') {
            const char* q = p + 2;
            const char* start = q;
            while (*q && !(q[0]==']' && q[1]==']')) q++;
            if (*q == '\0') break;
            size_t len = (size_t)(q - start);
            char* title = (char*)malloc(len + 1);
            if (!title) break;
            memcpy(title, start, len);
            title[len] = '\0';

            // check uniqueness
            int found = 0;
            for (size_t i = 0; i < out->count; ++i) {
                if (strcmp(out->nodes[i], title) == 0) { found = 1; break; }
            }
            if (!found) {
                char** tmp = (char**)realloc(out->nodes, sizeof(char*) * (out->count + 1));
                if (!tmp) { free(title); break; }
                out->nodes = tmp;
                out->nodes[out->count++] = title;
            } else {
                free(title);
            }

            p = q + 2;
            continue;
        }
        p++;
    }
    return 0;
}

void md_graph_free(md_graph_t* g) {
    if (!g) return;
    for (size_t i = 0; i < g->count; ++i) free(g->nodes[i]);
    free(g->nodes);
    g->nodes = NULL;
    g->count = 0;
}
