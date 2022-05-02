import { Project, ts } from "https://deno.land/x/ts_morph@14.0.0/mod.ts";

const project = new Project({
  tsConfigFilePath: "./tsconfig.json",
  resolutionHost: (moduleResolutionHost, getCompilerOptions) => {
    return {
      resolveModuleNames: (moduleNames, containingFile) => {
        const compilerOptions = getCompilerOptions();
        const resolvedModules: ts.ResolvedModule[] = [];
        for (const moduleName of moduleNames) {
          const resolvedFileName = removeTsExtension(moduleName);
          const result = ts.resolveModuleName(
            resolvedFileName,
            containingFile,
            compilerOptions,
            moduleResolutionHost,
          );
          if (result.resolvedModule) {
            resolvedModules.push(result.resolvedModule);
          }
        }
        return resolvedModules;
      },
    };
  },
});
for (const diagnostic of project.getPreEmitDiagnostics()) {
  console.log(diagnostic.getMessageText());
}

function removeTsExtension(moduleName: string) {
  if (moduleName.slice(-3).toLowerCase() === ".ts") {
    return moduleName.slice(0, -3);
  }
  return moduleName;
}

project.getSourceFiles().forEach((x) => {
  x.getExportDeclarations().forEach((y) => {
    const name = y.getModuleSpecifierValue();
    if (name) {
      y.setModuleSpecifier(removeTsExtension(name));
    }
  });
  x.getImportDeclarations().forEach((y) => {
    const t = y.getModuleSpecifierValue();
    y.setModuleSpecifier(removeTsExtension(t));
  });
});

const result = await project.emit();
for (const diagnostic of result.getDiagnostics()) {
  console.log(diagnostic.getMessageText());
  console.log(diagnostic.getLineNumber());
}
