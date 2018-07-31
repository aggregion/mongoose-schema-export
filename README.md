Mongoose schema export
======================

Usage example:
```
  mongoose-schema-export --excludeModels=Catalog,PrintJob --excludeFields=__v --cwd=main/src/app/id --pattern=**/*.model.js  --format=drawio --output=drawio.xml
```

Options:
```
  -f, --format         Output format.             (default value: "drawio")
  -o, --output         Output file.
  -p, --pattern        Search glob pattern.       (default value: "**/*.model.js")
  -c, --cwd            Current working directory.
  -e, --excludeModels  Exclude models.
  -x, --excludeFields  Exclude fields.            (default value: "__v")
  -i, --includeFields  Include fields.
```