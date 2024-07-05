import llvm from '../../';

describe('Test type testers', () => {

    // in C++ the node.js native api-based wrapper classes wrapping the actual LLVM derived types of the same name (ArrayType, ...)
    //  do _not_ extend the wrapper class 'Type' wrapping the LLVM base type 'llvm::Type'
    //  (I don't know why, maybe a node.js native api restriction)

    // Therefore, the tester methods tested below are implemented for each derived type wrapper class separately
    //  and, thus, need to be tested separately for each derived type.

    test('Test with IntegerType', () => {
        expect(llvm.config.LLVM_DEFAULT_TARGET_TRIPLE).toEqual(expect.any(String));
        const context = new llvm.LLVMContext();
        const irBuilder = new llvm.IRBuilder(context);

        [
            irBuilder.getInt8Ty(),
            irBuilder.getInt8(0).getType(),
            llvm.ConstantInt.get(irBuilder.getInt8Ty(), 0).getType()

        ].forEach(valInt8Type => {
            expect(valInt8Type.isArrayTy()).toBe(false);
            expect(valInt8Type.isFunctionTy()).toBe(false);
            expect(valInt8Type.isIntegerTy()).toBe(true);
            expect(valInt8Type.isIntegerTy(8)).toBe(true);
            expect(valInt8Type.isIntegerTy(9)).toBe(false);
            expect(valInt8Type.isIntegerTy(16)).toBe(false);
            expect(valInt8Type.isPointerTy()).toBe(false);
            expect(valInt8Type.isStructTy()).toBe(false);
            expect(valInt8Type.isVectorTy()).toBe(false);
            expect(valInt8Type.isVoidTy()).toBe(false);
        });

        llvm.ConstantInt.get(context, new llvm.APInt(128, 2^80, false)).getType().isIntegerTy(128)

    });

    test('Test with ArrayType', () => {
        const context = new llvm.LLVMContext();
        const irBuilder = new llvm.IRBuilder(context);
        const module = new llvm.Module('testModule', context);

        [
            llvm.ArrayType.get(irBuilder.getInt8Ty(), 17),
            llvm.ConstantArray.get(
                llvm.ArrayType.get(irBuilder.getInt8Ty(), 17),
                Array.from({ length: 17 }, (_, i) => irBuilder.getInt8(i+1))
            ).getType()

        ].forEach(valArrayType => {
            expect(valArrayType.isArrayTy()).toBe(true);
            expect(valArrayType.isArrayTy() && valArrayType.getNumElements()).toBe(17);
            expect(valArrayType.isFunctionTy()).toBe(false);
            expect(valArrayType.isIntegerTy()).toBe(false);
            expect(valArrayType.isIntegerTy(8)).toBe(false);
            expect(valArrayType.isPointerTy()).toBe(false);
            expect(valArrayType.isStructTy()).toBe(false);
            expect(valArrayType.isVectorTy()).toBe(false);
            expect(valArrayType.isVoidTy()).toBe(false);

            expect(module.getDataLayout().getTypeAllocSize(valArrayType)).toBe(17);
            expect(module.getDataLayout().getTypeAllocSizeInBits(valArrayType)).toBe(136);
        });
    });

    test('Test with StructType', () => {
        const context = new llvm.LLVMContext();
        const irBuilder = new llvm.IRBuilder(context);
        const module = new llvm.Module('testModule', context);

        [
            llvm.StructType.create(context, [ irBuilder.getInt8Ty(), irBuilder.getInt8Ty() ], 'myStruct'),
            llvm.ConstantStruct.get(
                llvm.StructType.get(context, [ irBuilder.getInt8Ty(), irBuilder.getInt8Ty() ]),
                Array.from({ length: 2 }, (_, i) => irBuilder.getInt8(i+1))
            ).getType(),
            llvm.StructType.getTypeByName(context, 'myStruct')!

        ].forEach(valStructType => {
            expect(valStructType.isArrayTy()).toBe(false);
            expect(valStructType.isFunctionTy()).toBe(false);
            expect(valStructType.isIntegerTy()).toBe(false);
            expect(valStructType.isIntegerTy(8)).toBe(false);
            expect(valStructType.isPointerTy()).toBe(false);
            expect(valStructType.isStructTy()).toBe(true);
            expect(valStructType.isVectorTy()).toBe(false);
            expect(valStructType.isVoidTy()).toBe(false);

            expect(valStructType.isStructTy() && valStructType.getNumElements()).toBe(2);
            expect(valStructType.isStructTy() && valStructType.getElementType(0).isIntegerTy(8)).toBe(true);
            expect(valStructType.isStructTy() && valStructType.getElementType(1).isIntegerTy(8)).toBe(true);

            expect(module.getDataLayout().getTypeAllocSize(valStructType)).toBe(2);
            expect(module.getDataLayout().getTypeAllocSizeInBits(valStructType)).toBe(16);

            expect(new llvm.DataLayout(module).getTypeAllocSize(valStructType)).toBe(2);
            expect(new llvm.DataLayout(module.getDataLayoutStr()).getTypeAllocSizeInBits(valStructType)).toBe(16);
        });
    });


    test('Test with VectorType', () => {
        const context = new llvm.LLVMContext();
        const irBuilder = new llvm.IRBuilder(context);

        [
            llvm.VectorType.get(irBuilder.getInt8Ty(), 17, false),
            // not available in llvm-bindings yet
            /* ConstantVector.get(
                llvm.VectorType.get(irBuilder.getInt8Ty(), 17, false),
                Array.from({ length: 17 }, (_, i) => irBuilder.getInt8(i+1))
            ).getType()*/

        ].forEach(valVectorType => {
            expect(valVectorType.isArrayTy()).toBe(false);
            expect(valVectorType.isFunctionTy()).toBe(false);
            expect(valVectorType.isIntegerTy()).toBe(false);
            expect(valVectorType.isPointerTy()).toBe(false);
            expect(valVectorType.isStructTy()).toBe(false);
            expect(valVectorType.isVectorTy()).toBe(true);
            expect(valVectorType.isVoidTy()).toBe(false);
        });
    });

    test('Test with FunctionType', () => {
        const context = new llvm.LLVMContext();
        const irBuilder = new llvm.IRBuilder(context);

        [
            llvm.FunctionType.get(irBuilder.getVoidTy(), [ irBuilder.getInt8Ty(), irBuilder.getInt8Ty() ], false),
            llvm.FunctionType.get(irBuilder.getInt8Ty(), [ irBuilder.getInt8Ty() ], true),
            new llvm.Module('testModule', context).getOrInsertFunction(
                'testFunction',
                llvm.FunctionType.get(irBuilder.getInt1Ty(), [], false)
            ).getFunctionType(),

        ].forEach(valFunctionType => {
            expect(valFunctionType.isArrayTy()).toBe(false);
            expect(valFunctionType.isFunctionTy()).toBe(true);
            expect(valFunctionType.isIntegerTy()).toBe(false);
            expect(valFunctionType.isPointerTy()).toBe(false);
            expect(valFunctionType.isStructTy()).toBe(false);
            expect(valFunctionType.isVectorTy()).toBe(false);
            expect(valFunctionType.isVoidTy()).toBe(false);
        });
    });

    test('Test with PointerType', () => {
        const context = new llvm.LLVMContext();
        const irBuilder = new llvm.IRBuilder(context);

        [
            irBuilder.getInt8PtrTy(),
            llvm.PointerType.get(irBuilder.getInt8Ty(), 0),
            llvm.StructType.get(context, [ irBuilder.getInt8Ty(), irBuilder.getInt8Ty() ]).getPointerTo()
        ].forEach(valPointerType => {
            expect(valPointerType.isArrayTy()).toBe(false);
            expect(valPointerType.isFunctionTy()).toBe(false);
            expect(valPointerType.isIntegerTy()).toBe(false);
            expect(valPointerType.isPointerTy()).toBe(true);
            expect(valPointerType.isStructTy()).toBe(false);
            expect(valPointerType.isVectorTy()).toBe(false);
            expect(valPointerType.isVoidTy()).toBe(false);
        });
    });
});
