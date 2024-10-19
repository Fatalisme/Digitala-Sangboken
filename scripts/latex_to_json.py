import os
import re
import json
import uuid

def clean_latex(text):
    if not isinstance(text, str):
        return ""
    text = re.sub(r'\\newpage', '', text)
    text = re.sub(r'%.*$', '', text, flags=re.MULTILINE)
    return text.strip()

def process_styling(text):
    if not isinstance(text, str):
        return ""
    # Replace \leftrepeat and \rightrepeat with bold ||
    text = re.sub(r'\\leftrepeat', r'<b>||</b>', text)
    text = re.sub(r'\\rightrepeat', r'<b>||</b>', text)
    
    # Transforming text styling
    text = re.sub(r'\\textit{(.+?)}', r'<i>\1</i>', text)
    text = re.sub(r'\\textbf{(.+?)}', r'<b>\1</b>', text)
    return text

def parse_latex_songs(file_path):
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            content = clean_latex(file.read())
    except Exception as e:
        print(f"Error reading file {file_path}: {e}")
        return []

    # Extract category from filename (without extension)
    category = os.path.splitext(os.path.basename(file_path))[0]

    song_blocks = re.split(r'\\song{', content)[1:]
    songs = []

    for block in song_blocks:
        song_data = { 'id': str(uuid.uuid4()),
         'category': category,
         'title': '',
         'melody': '',
         'author': '',
         'info': '',
         'lyrics': []
         
         }  # Generates a unique UUID for each song andAdd category to each song

        title_match = re.match(r'(.+?)}', block)
        if title_match:
            song_data['title'] = title_match.group(1)

        melody_match = re.search(r'\\melo{(.+?)}', block)
        if melody_match:
            song_data['melody'] = melody_match.group(1)

        author_match = re.search(r'\\author{(.+?)}', block)
        if author_match:
            song_data['author'] = author_match.group(1)

        info_match = re.search(r'\\songinfo{(.+?)}', block)
        if info_match:
            song_data['info'] = clean_latex(info_match.group(1))
            block = block.replace(info_match.group(0), '')
        

        lyrics = re.findall(r'\\songtext{(.*?)}(.*?)(?=\\songtext|\Z)', block, re.DOTALL)
        song_data['lyrics'] = []
        for songtext_content, lyric_block in lyrics:
            if songtext_content.strip():
                song_data['lyrics'].append(clean_latex(songtext_content.strip()))
            lines = [clean_latex(line.strip()) for line in lyric_block.split('\\\\') if line.strip()]
            song_data['lyrics'].extend(lines)


        special_parts = re.findall(r'\\textbf{\\textit{(.+?):}}(.+?)\\\\', block)
        for part, line in special_parts:
            song_data['lyrics'].append({part.lower(): clean_latex(line.strip())})

        song_data['lyrics'] = [process_styling(line) if isinstance(line, str) else line for line in song_data['lyrics']]
        song_data['lyrics'] = [line for line in song_data['lyrics'] if line]


        songs.append(song_data)
        

    return songs

def process_latex_files(input_directory, output_file):
    all_songs = []

    for filename in os.listdir(input_directory):
        if filename.endswith('.tex'):
            file_path = os.path.join(input_directory, filename)
            try:
                songs = parse_latex_songs(file_path)
                all_songs.extend(songs)
            except Exception as e:
                print(f"Error processing file {filename}: {e}")

    try:
        with open(output_file, 'w', encoding='utf-8') as outfile:
            json.dump(all_songs, outfile, ensure_ascii=False, indent=2)
        print(f"Successfully wrote {len(all_songs)} songs to {output_file}")
    except Exception as e:
        print(f"Error writing to output file: {e}")

# Custom JSON encoder to handle line breaks
class LineBreakEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, str):
            return obj.replace('\n', '\\n')
        return json.JSONEncoder.default(self, obj)

# Function to process lyrics
def process_lyrics(lyrics):
    processed_lyrics = []
    for item in lyrics:
        if isinstance(item, str):
            processed_lyrics.append(item)
        elif isinstance(item, dict):
            for key, value in item.items():
                processed_lyrics.append(f"{key}: {value}")
    return '\n'.join(processed_lyrics)

# Usage
input_directory = './latexsong'
output_file = './data/lesongs.json'
process_latex_files(input_directory, output_file)

# Read the JSON file and reformat it with line breaks
with open(output_file, 'r', encoding='utf-8') as file:
    songs = json.load(file)

for song in songs:
    if 'lyrics' in song:
        song['lyrics'] = process_lyrics(song['lyrics'])

with open(output_file, 'w', encoding='utf-8') as file:
    json.dump(songs, file, ensure_ascii=False, indent=2, cls=LineBreakEncoder)



