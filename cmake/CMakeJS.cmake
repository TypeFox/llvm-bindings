# the aim of this script is to ensure the definition of the following variables,
#  which are referenced by the root script in '../CMakeLists.txt';
# be aware that cmake caches the assignments of properties, here in './build/CMakeCache.txt',
#  once set those assignments don't need to be repeated in consecutive calls of 'cmake';

# consequently, in order to prevent potentially unexpected re-assignments by this script:
if ((DEFINED CMAKE_JS_SRC) AND (DEFINED CMAKE_JS_INC) AND (DEFINED CMAKE_JS_LIB))
    message(STATUS "Early returning from CMakeJS.cmake, as CMAKE_JS_SRC, CMAKE_JS_INC and CMAKE_JS_LIB are already defined.")
    return()
endif()

if (CMAKE_HOST_WIN32)
    find_program(CMakeJS "cmake-js.cmd")
    find_program(NPM "npm.cmd")
else ()
    find_program(CMakeJS "cmake-js")
    find_program(NPM "npm")
endif()

if (NPM)
    message(STATUS "Found NPM")
else ()
    message(FATAL_ERROR "NPM not found. This project requires Node.js.")
endif ()

if (CMakeJS)
    message(STATUS "Found CMake.js")
else ()
    message(FATAL_ERROR "CMake.js not found. This project requires cmake-js installed globally.")
endif ()

function(GET_VARIABLE INPUT_STRING VARIABLE_TO_SELECT OUTPUT_VARIABLE)
    set(SEARCH_STRING "-D${VARIABLE_TO_SELECT}=")
    string(LENGTH ${SEARCH_STRING} SEARCH_STRING_LENGTH)
    string(LENGTH ${INPUT_STRING} INPUT_STRING_LENGTH)
    string(FIND ${INPUT_STRING} ${SEARCH_STRING} SEARCH_STRING_INDEX)
    if (${SEARCH_STRING_INDEX} LESS 0)
        set(${OUTPUT_VARIABLE} "" PARENT_SCOPE)
    else ()
        math(EXPR SEARCH_STRING_INDEX "${SEARCH_STRING_INDEX}+${SEARCH_STRING_LENGTH}")
        string(SUBSTRING ${INPUT_STRING} ${SEARCH_STRING_INDEX} ${INPUT_STRING_LENGTH} AFTER_SEARCH_STRING)
        # here, ${AFTER_SEARCH_STRING} may be a string of ';'-separated substrings being composed by cmake.js, see cmake-js/lib/cMake.js, line 140ff.;
        # after expanding cmake treats that string as a list of values, which are then assigned to the arguments of 'FIND',
        #  which will break the call of 'FIND' because of an argument number mismatch -> wrap ${AFTER_SEARCH_STRING} with "" !
        string(FIND "${AFTER_SEARCH_STRING}" "'" QUOTE_INDEX)
        string(SUBSTRING "${AFTER_SEARCH_STRING}" 0 ${QUOTE_INDEX} RESULT_STRING)
        set(${OUTPUT_VARIABLE} "${RESULT_STRING}" PARENT_SCOPE)
    endif ()
endfunction(GET_VARIABLE)

# just to be explicit:
if(NOT CMAKE_BUILD_TYPE)
    set(CMAKE_BUILD_TYPE "release")
endif()

string(TOLOWER ${CMAKE_BUILD_TYPE} CMAKE_BUILD_TYPE_LOWER)

if (CMAKE_BUILD_TYPE_LOWER STREQUAL "debug")
    execute_process(
            COMMAND ${CMakeJS} print-configure --debug
            WORKING_DIRECTORY ${CMAKE_CURRENT_SOURCE_DIR}
            OUTPUT_VARIABLE CMAKE_JS_OUTPUT
    )
else ()
    execute_process(
            COMMAND ${CMakeJS} print-configure
            WORKING_DIRECTORY ${CMAKE_CURRENT_SOURCE_DIR}
            OUTPUT_VARIABLE CMAKE_JS_OUTPUT
    )
endif ()

# only write the following variables if and only if they haven't been already determined by the caller,
#  specifically, don't overwrite them!
if (NOT CMAKE_JS_INC)
    get_variable(${CMAKE_JS_OUTPUT} "CMAKE_JS_INC" CMAKE_JS_INC)
endif()

if (NOT CMAKE_JS_LIB)
    get_variable(${CMAKE_JS_OUTPUT} "CMAKE_JS_LIB" CMAKE_JS_LIB)
endif()

if (NOT CMAKE_JS_SRC)
    get_variable(${CMAKE_JS_OUTPUT} "CMAKE_JS_SRC" CMAKE_JS_SRC)
endif()