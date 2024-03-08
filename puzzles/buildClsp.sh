#!/bin/bash

# Ensure the correct number of arguments are provided
if [ "$#" -ne 2 ]; then
    echo "Usage: $0 <input_path> <output_json_path>"
    exit 1
fi

input_path="$1"
output_json_path="$2"

# Execute the 'run' command with the provided input path and capture its output
run_output=$(run "$input_path" -O -i ./)
if [ $? -ne 0 ]; then
    echo "Failed to execute 'run' command on input path: $input_path"
    exit 2
fi

# Assuming 'opc' can handle input as a file, we'll write the 'run' output to a temporary file
temp_file=$(mktemp)
echo "$run_output" > "$temp_file"

# Now, pass the temporary file to 'opc' and capture its output
opc_output=$(opc "$temp_file")

# Check for errors after running 'opc'
if [ $? -ne 0 ]; then
    echo "Failed to execute 'opc' with the output from 'run'"
    rm "$temp_file" # Clean up temporary file
    exit 3
fi

# Save the 'opc' output to a JSON file
echo "{\"hex\": \"$opc_output\"}" > "$output_json_path"
echo $run_output
# Clean up the temporary file
rm "$temp_file"

echo "Output saved to $output_json_path"
