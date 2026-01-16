#!/bin/bash

# دالة للتحقق إذا كان النص يحتوي على أحرف عربية
contains_arabic() {
    echo "$1" | grep -q '[ء-ي]'
    return $?
}

# دالة لتحويل snake_case إلى PascalCase
snake_to_pascal() {
    local input="$1"
    local output=""
    local capitalize_next=true
    
    for ((i=0; i<${#input}; i++)); do
        char="${input:$i:1}"
        
        if [[ "$char" == "_" ]]; then
            capitalize_next=true
        else
            if $capitalize_next; then
                output+="${char^^}"
                capitalize_next=false
            else
                output+="$char"
            fi
        fi
    done
    
    echo "$output"
}

# البحث عن جميع الملفات بشكل تكراري
find . -type f -name "*.pdf" | while read -r filepath; do
    # الحصول على المسار والاسم
    dir=$(dirname "$filepath")
    filename=$(basename "$filepath")
    name="${filename%.*}"
    ext="${filename##*.}"
    
    # تجاهل الملفات التي تحتوي على أحرف عربية
    if contains_arabic "$name"; then
        echo "تجاهل (عربي): $filename"
        continue
    fi
    
    # تحقق إذا كان الاسم يحتوي على _
    if [[ "$name" == *_* ]]; then
        new_name=$(snake_to_pascal "$name")
        new_filepath="$dir/$new_name.$ext"
        
        # إعادة التسمية
        if [[ "$filepath" != "$new_filepath" ]]; then
            mv "$filepath" "$new_filepath"
            echo "✓ تم: $filename → $new_name.$ext"
        fi
    fi
done

echo ""
echo "اكتمل!"
