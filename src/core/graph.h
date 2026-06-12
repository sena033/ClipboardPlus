#ifndef GRAPH_H
#define GRAPH_H

#include <stddef.h>

// Simple graph extracted from markdown links [[Title]]
typedef struct {
    char** nodes; // array of node titles
    size_t count;
} md_graph_t;

// Parse content and populate graph with unique node titles found in [[Title]] links.
// Caller must free graph using md_graph_free.
int md_graph_parse(const char* content, md_graph_t* out);
void md_graph_free(md_graph_t* g);

#endif // GRAPH_H
