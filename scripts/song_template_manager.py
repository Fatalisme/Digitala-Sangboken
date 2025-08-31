import sys
import os

def add_template_to_file(file_path, num_templates=1):
    song_template = """
\song{Song name}
\melo{Melodi: }
\author{Text: }
\tags{}
\songinfo{here}

\songtext{}here




%-------------------------------------------------------------

"""
    with open(file_path, 'a', encoding='utf-8') as file:
        for _ in range(num_templates):
            file.write(song_template)
    print(f"{num_templates} template(s) added to '{file_path}'")

if __name__ == "__main__":
    if len(sys.argv) < 4:
        print("Usage: python song_template_manager.py add <number_of_templates> <file_path>")
        sys.exit(1)
    
    action = sys.argv[1]
    if action != "add":
        print("Invalid action. Use 'add'.")
        sys.exit(1)

    num_templates = int(sys.argv[2])
    file_path = sys.argv[3]
    
    if not os.path.exists(file_path):
        print(f"File not found: {file_path}")
        sys.exit(1)
    
    add_template_to_file(file_path, num_templates)
