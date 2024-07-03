import path from "path";
import llvm from "../..";

const fileName = path.basename(__filename);

describe('Test DIBuilder', () => {
    describe('Test createArrayType', () => {
        test('Debug Info for array present in file', () => {
            const context = new llvm.LLVMContext();
            const module = new llvm.Module(fileName, context);
            const irBuilder = new llvm.IRBuilder(context);
            const diBuilder = new llvm.DIBuilder(module);

            const debugInfoFile = diBuilder.createFile(fileName, __dirname);
            const debugInfoUnit = diBuilder.createCompileUnit(llvm.dwarf.SourceLanguage.DW_LANG_C, debugInfoFile, 'llvm-bindings', false, '', 0);

            const debugInfoIntType = diBuilder.createBasicType('int', 32, llvm.dwarf.TypeKind.DW_ATE_float);

            const debugInfoArrayType = diBuilder.createArrayType(2, 32, debugInfoIntType, [debugInfoIntType, debugInfoIntType]);

            const mainFunctionReturnType = irBuilder.getInt32Ty();
            const mainFunctionType = llvm.FunctionType.get(mainFunctionReturnType, false);
            const mainFunction = llvm.Function.Create(mainFunctionType, llvm.Function.LinkageTypes.ExternalLinkage, 'main', module);

            const debugInfoParamTypes = diBuilder.getOrCreateTypeArray([debugInfoIntType]);
            const debugInfoSubroutineType = diBuilder.createSubroutineType(debugInfoParamTypes);
            const debugInfoMainFuncSubprogram = diBuilder.createFunction(
                debugInfoFile, 'main', '', debugInfoFile, 1,
                debugInfoSubroutineType, 1, llvm.DINode.DIFlags.FlagPrototyped, llvm.DISubprogram.DISPFlags.SPFlagDefinition
            );

            mainFunction.setSubprogram(debugInfoMainFuncSubprogram);
            irBuilder.SetCurrentDebugLocation(new llvm.DebugLoc());

            const entryBB = llvm.BasicBlock.Create(context, 'entry', mainFunction);
            irBuilder.SetInsertPoint(entryBB);

            const arrayType = llvm.ArrayType.get(irBuilder.getInt32Ty(), 2);
            const allocaArray = irBuilder.CreateAlloca(arrayType, irBuilder.getInt32(2), 'array');

            const diLocalVarArray = diBuilder.createAutoVariable(debugInfoMainFuncSubprogram, 'array', debugInfoFile, 2, debugInfoArrayType);
            diBuilder.insertDeclare(allocaArray, diLocalVarArray, diBuilder.createExpression(), llvm.DILocation.get(context, 2, 9, debugInfoMainFuncSubprogram), irBuilder.GetInsertBlock()!);

            diBuilder.finalize();
            
            const output = module.print();

            expect(output).toContain(`!8 = !DICompositeType(tag: DW_TAG_array_type, baseType: !5, size: 2, align: 32, elements: !9)`);
        });
    });

    describe('Test createStructType', () => {
        test('Debug Info for struct present in file', () => {
            const context = new llvm.LLVMContext();
            const module = new llvm.Module(fileName, context);
            const irBuilder = new llvm.IRBuilder(context);
            const diBuilder = new llvm.DIBuilder(module);

            const debugInfoFile = diBuilder.createFile(fileName, __dirname);

            const debugInfoIntType = diBuilder.createBasicType('int', 32, llvm.dwarf.TypeKind.DW_ATE_float);

            
            const mainFunctionReturnType = irBuilder.getInt32Ty();
            const mainFunctionType = llvm.FunctionType.get(mainFunctionReturnType, false);
            const mainFunction = llvm.Function.Create(mainFunctionType, llvm.Function.LinkageTypes.ExternalLinkage, 'main', module);
            
            const debugInfoParamTypes = diBuilder.getOrCreateTypeArray([debugInfoIntType]);
            const debugInfoSubroutineType = diBuilder.createSubroutineType(debugInfoParamTypes);
            const debugInfoMainFuncSubprogram = diBuilder.createFunction(
                debugInfoFile, 'main', '', debugInfoFile, 1,
                debugInfoSubroutineType, 1, llvm.DINode.DIFlags.FlagPrototyped, llvm.DISubprogram.DISPFlags.SPFlagDefinition
            );
            
            mainFunction.setSubprogram(debugInfoMainFuncSubprogram);
            irBuilder.SetCurrentDebugLocation(new llvm.DebugLoc());
            
            const entryBB = llvm.BasicBlock.Create(context, 'entry', mainFunction);
            irBuilder.SetInsertPoint(entryBB);
            
            const structType = llvm.StructType.get(context, [irBuilder.getInt32Ty(), irBuilder.getInt32Ty()]);
            const allocaStruct = irBuilder.CreateAlloca(structType, null, 'struct');
            
            const debugInfoStructType = diBuilder.createStructType(debugInfoFile, 'struct', debugInfoFile, 1, 64, 0, llvm.DINode.DIFlags.FlagPublic, undefined,[debugInfoIntType, debugInfoIntType]);

            const diLocalVarStruct = diBuilder.createAutoVariable(debugInfoMainFuncSubprogram, 'struct', debugInfoFile, 2, debugInfoStructType);
            diBuilder.insertDeclare(allocaStruct, diLocalVarStruct, diBuilder.createExpression(), llvm.DILocation.get(context, 2, 9, debugInfoMainFuncSubprogram), irBuilder.GetInsertBlock()!);

            diBuilder.finalize();

            const output = module.print();

            expect(output).toContain(`!7 = !DICompositeType(tag: DW_TAG_structure_type, name: "struct", scope: !1, file: !1, line: 1, size: 64, flags: DIFlagPublic, elements: !8)`);
        });
    })
});