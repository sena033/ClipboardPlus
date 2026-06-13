// Compatibility shim for minimal Windows file APIs used by filemgr.c
#ifndef FILEMGR_WIN_COMPAT_H
#define FILEMGR_WIN_COMPAT_H

#ifdef _WIN32
#include <direct.h> // _mkdir
#include <io.h>     // _findfirst, _findnext
#include <sys/stat.h>
#include <sys/types.h>
#endif

#endif // FILEMGR_WIN_COMPAT_H
