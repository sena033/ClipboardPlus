#include "rtext_extra.h"
#include <string.h>
#include <stdlib.h>

void DrawTextRec(Font font, const char *text, Rectangle rec, float fontSize,
                 float spacing, bool wordWrap, Color tint)
{
    if (!text || !*text) return;

    // Buffer for building each word-wrapped line
    size_t text_len = strlen(text);

    // --- Try word-wrap path first (preferred) ---
    if (wordWrap)
    {
        // Allocate a temporary line buffer as large as the input
        char *line = (char *)malloc(text_len + 1);
        if (!line) { wordWrap = false; goto fallback; }

        size_t line_pos = 0;
        size_t i = 0;
        float line_height = fontSize + spacing;
        float y = rec.y;

        while (i < text_len && y + line_height <= rec.y + rec.height)
        {
            // Peek ahead for newline
            if (text[i] == '\n')
            {
                line[line_pos] = '\0';
                Vector2 sz = MeasureTextEx(font, line, fontSize, spacing);
                DrawTextEx(font, line, (Vector2){ rec.x, y }, fontSize, spacing, tint);
                y += line_height;
                i++;
                line_pos = 0;
                continue;
            }

            // Scan next word
            size_t word_start = i;
            while (i < text_len && text[i] != ' ' && text[i] != '\n') i++;

            // word_end is at first space or newline or end
            // Copy word into line buffer temporarily to measure
            size_t word_len = i - word_start;
            if (word_len > 0)
            {
                // Check if adding this word would overflow width
                // Save current line + space + word for measurement
                char saved = line[line_pos];
                if (line_pos > 0) { line[line_pos] = ' '; line_pos++; }
                memcpy(line + line_pos, text + word_start, word_len);
                line_pos += word_len;
                line[line_pos] = '\0';

                Vector2 sz = MeasureTextEx(font, line, fontSize, spacing);
                if (sz.x > rec.width && (line_pos - word_len - (line_pos > word_len ? 1 : 0)) > 0)
                {
                    // Word doesn't fit: draw what we have (excluding this word)
                    if (line_pos > word_len + 1)
                    {
                        line[line_pos - word_len - 1] = '\0'; // remove space + word
                        DrawTextEx(font, line, (Vector2){ rec.x, y }, fontSize, spacing, tint);
                    }
                    y += line_height;
                    // Start new line with this word
                    line_pos = 0;
                    memcpy(line, text + word_start, word_len);
                    line_pos = word_len;
                    line[line_pos] = '\0';
                }
            }

            // Skip spaces
            while (i < text_len && text[i] == ' ') i++;
        }

        // Draw remaining line
        if (line_pos > 0 && y + line_height <= rec.y + rec.height)
        {
            line[line_pos] = '\0';
            DrawTextEx(font, line, (Vector2){ rec.x, y }, fontSize, spacing, tint);
        }

        free(line);
        return;
    }

fallback:
    // --- No word-wrap: single line, clipped to rectangle ---
    {
        float line_height = fontSize + spacing;
        const char *p = text;
        float y = rec.y;
        while (*p && y + line_height <= rec.y + rec.height)
        {
            // Find end of line
            const char *nl = strchr(p, '\n');
            size_t line_len = nl ? (size_t)(nl - p) : strlen(p);
            if (line_len == 0)
            {
                y += line_height;
                p = nl ? nl + 1 : p + line_len;
                continue;
            }

            // Extract line segment to measure
            char *seg = (char *)malloc(line_len + 1);
            if (!seg) break;
            memcpy(seg, p, line_len);
            seg[line_len] = '\0';

            Vector2 sz = MeasureTextEx(font, seg, fontSize, spacing);
            free(seg);

            // Draw; will be clipped by scissor if caller sets it
            DrawTextEx(font, p, (Vector2){ rec.x, y }, fontSize, spacing, tint);
            y += line_height;
            p = nl ? nl + 1 : p + line_len;
        }
    }
}
