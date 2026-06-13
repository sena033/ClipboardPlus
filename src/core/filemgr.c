#include "filemgr.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <errno.h>
#ifdef _WIN32
#include "filemgr_win_compat.h"
#else
#include <sys/stat.h>
#include <dirent.h>
#endif

int filemgr_load_note(const char* path, note_t* out) {
    if (!path || !out) return -1;
    FILE* f = fopen(path, "rb");
    if (!f) return -1;
    fseek(f, 0, SEEK_END);
    long sz = ftell(f);
    fseek(f, 0, SEEK_SET);
    char* buf = (char*)malloc((size_t)sz + 1);
    if (!buf) { fclose(f); return -1; }
    size_t r = fread(buf, 1, (size_t)sz, f);
    buf[r] = '\0';
    fclose(f);

    // Use filename (without directories) as title fallback
    const char* slash = strrchr(path, '/');
    #ifdef _WIN32
    if (!slash) slash = strrchr(path, '\\');
    #endif
    const char* title = slash ? slash + 1 : path;

    out->title = strdup(title);
    out->content = buf; // take ownership
    return 0;
}

int filemgr_save_note(const char* path, const note_t* note) {
    if (!path || !note) return -1;
    FILE* f = fopen(path, "wb");
    if (!f) return -1;
    size_t w = fwrite(note->content ? note->content : "", 1, strlen(note->content ? note->content : ""), f);
    fclose(f);
    return (w > 0 || (note->content && note->content[0]=='\0')) ? 0 : -1;
}

int filemgr_ensure_notes_dir(void) {
    const char* dir = "notes";
    #ifdef _WIN32
    if (_mkdir(dir) != 0) {
        if (errno != EEXIST) return -1;
    }
    return 0;
    #else
    if (mkdir(dir, 0755) != 0) {
        if (errno != EEXIST) return -1;
    }
    return 0;
    #endif
}

int filemgr_list_notes(char*** out_list) {
    if (!out_list) return -1;
    *out_list = NULL;
    int count = 0;
    filemgr_ensure_notes_dir();
    #ifdef _WIN32
    // Use Windows API via _findfirst
    struct _finddata_t fd;
    intptr_t h = _findfirst("notes\\*.md", &fd);
    if (h == -1) return 0;
    do {
        char* name = strdup(fd.name);
        char** tmp = realloc(*out_list, sizeof(char*) * (count + 1));
        if (!tmp) { free(name); break; }
        *out_list = tmp; (*out_list)[count++] = name;
    } while (_findnext(h, &fd) == 0);
    _findclose(h);
    #else
    DIR* d = opendir("notes");
    if (!d) return 0;
    struct dirent* ent;
    while ((ent = readdir(d)) != NULL) {
        if (ent->d_type == DT_REG) {
            const char* p = ent->d_name;
            size_t L = strlen(p);
            if (L > 3 && strcmp(p + L - 3, ".md") == 0) {
                char* name = strdup(p);
                char** tmp = realloc(*out_list, sizeof(char*) * (count + 1));
                if (!tmp) { free(name); break; }
                *out_list = tmp; (*out_list)[count++] = name;
            }
        }
    }
    closedir(d);
    #endif
    return count;
}

void filemgr_free_list(char** list, int count) {
    if (!list) return;
    for (int i = 0; i < count; ++i) free(list[i]);
    free(list);
}
