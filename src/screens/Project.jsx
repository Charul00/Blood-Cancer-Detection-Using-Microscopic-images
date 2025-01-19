import React, { useState, useEffect, useContext, useRef } from 'react'
import { UserContext } from '../context/user.context'
import { useNavigate, useLocation } from 'react-router-dom'
import axios from '../config/axios'
import { initializeSocket, receiveMessage, sendMessage } from '../config/socket'
import Markdown from 'markdown-to-jsx'
import hljs from 'highlight.js'
import { getWebContainer } from '../config/webContainer'

// Syntax highlighting component for code blocks
function SyntaxHighlightedCode(props) {
    const ref = useRef(null)

    React.useEffect(() => {
        if (ref.current && props.className?.includes('lang-') && window.hljs) {
            window.hljs.highlightElement(ref.current)
            ref.current.removeAttribute('data-highlighted')
        }
    }, [props.className, props.children])

    return <code {...props} ref={ref} />
}

// Helper function to determine file language for syntax highlighting
const getFileLanguage = (filename) => {
    const ext = filename.split('.').pop().toLowerCase();
    const languageMap = {
        'html': 'html',
        'css': 'css',
        'js': 'javascript',
        'jsx': 'javascript',
        'json': 'json'
    };
    return languageMap[ext] || 'plaintext';
};

const Project = () => {
    const location = useLocation()
    const [isSidePanelOpen, setIsSidePanelOpen] = useState(false)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedUserId, setSelectedUserId] = useState(new Set())
    const [project, setProject] = useState(location.state.project)
    const [message, setMessage] = useState('')
    const { user } = useContext(UserContext)
    const messageBox = React.createRef()
    const [searchQuery, setSearchQuery] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [isWaitingForAI, setIsWaitingForAI] = useState(false)
    const [isRecording, setIsRecording] = useState(false)
    const [recognition, setRecognition] = useState(null)

    const [users, setUsers] = useState([])
    const [messages, setMessages] = useState([])
    const [fileTree, setFileTree] = useState({})

    const [currentFile, setCurrentFile] = useState(null)
    const [openFiles, setOpenFiles] = useState([])

    const [webContainer, setWebContainer] = useState(null)
    const [iframeUrl, setIframeUrl] = useState(null)
    const [runProcess, setRunProcess] = useState(null)

    const [isFileExplorerOpen, setIsFileExplorerOpen] = useState(() => {
        const saved = localStorage.getItem('fileExplorerOpen')
        return saved !== null ? JSON.parse(saved) : true
    })
    const [activeView, setActiveView] = useState('code')

    // Initialize speech recognition
    useEffect(() => {
        if ('webkitSpeechRecognition' in window) {
            const recognition = new window.webkitSpeechRecognition()
            recognition.continuous = false
            recognition.interimResults = false
            recognition.lang = 'en-US'

            recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript
                setMessage(prev => prev + ' ' + transcript)
                setIsRecording(false)
            }

            recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error)
                setIsRecording(false)
            }

            recognition.onend = () => {
                setIsRecording(false)
            }

            setRecognition(recognition)
        }
    }, [])

    // Handle microphone click
    const handleMicClick = () => {
        if (!recognition) {
            alert('Speech recognition is not supported in your browser')
            return
        }
        setMessage('@ai ' +me)
        if (isRecording) {
            recognition.stop()
        } else {
            setIsRecording(true)
            recognition.start()
        }
    }

    // Toggle file explorer
    const toggleFileExplorer = () => {
        setIsFileExplorerOpen(prev => {
            const newState = !prev
            localStorage.setItem('fileExplorerOpen', JSON.stringify(newState))
            return newState
        })
    }

    // Handle user selection
    const handleUserClick = (id) => {
        setSelectedUserId(prevSelectedUserId => {
            const newSelectedUserId = new Set(prevSelectedUserId)
            if (newSelectedUserId.has(id)) {
                newSelectedUserId.delete(id)
            } else {
                newSelectedUserId.add(id)
            }
            return newSelectedUserId
        })
    }

    // Handle file operations
    const handleCloseFile = (fileToClose) => {
        const newOpenFiles = openFiles.filter(file => file !== fileToClose)
        setOpenFiles(newOpenFiles)
        if (currentFile === fileToClose) {
            setCurrentFile(newOpenFiles[0] || null)
        }
    }

    // Handle image upload
    const handleImageUpload = async (event) => {
        const file = event.target.files[0]
        if (file) {
            try {
                setIsLoading(true)
                const reader = new FileReader()
                reader.onload = async (e) => {
                    const imageData = e.target.result

                    setMessages(prevMessages => [
                        ...prevMessages,
                        {
                            sender: user,
                            message: null,
                            image: imageData,
                        }
                    ])

                    try {
                        const response = await axios.post('http://localhost:14000/api/ai/generate-ui', {
                            imageData,
                        }, {
                            headers: {
                                'Content-Type': 'application/json',
                            },
                        })

                        const result = response.data

                        if (result.fileTree) {
                            setFileTree(prevTree => ({
                                ...prevTree,
                                ...result.fileTree,
                            }))

                            const firstFile = Object.keys(result.fileTree)[0]
                            if (firstFile) {
                                setCurrentFile(firstFile)
                                setOpenFiles(prev => [...new Set([...prev, firstFile])])
                            }

                            setMessages(prevMessages => [
                                ...prevMessages,
                                {
                                    sender: { _id: 'ai', email: 'AI Assistant' },
                                    message: JSON.stringify({ text: 'UI generated successfully!' }),
                                }
                            ])
                        }
                    } catch (error) {
                        console.error('Error generating UI:', error)
                        setMessages(prevMessages => [
                            ...prevMessages,
                            {
                                sender: { _id: 'ai', email: 'AI Assistant' },
                                message: JSON.stringify({ text: 'Error generating UI. Please try again.' }),
                            }
                        ])
                    } finally {
                        setIsLoading(false)
                    }
                }
                reader.readAsDataURL(file)
            } catch (error) {
                console.error('Error processing image:', error)
                setIsLoading(false)
            }
        }
    }

    // Add collaborators
    const addCollaborators = () => {
        axios.put("/projects/add-user", {
            projectId: location.state.project._id,
            users: Array.from(selectedUserId)
        }).then(res => {
            console.log(res.data)
            setIsModalOpen(false)
        }).catch(err => {
            console.log(err)
        })
    }

    // Send message functions
    const send = async () => {
        if (message.trim()) {
            setIsLoading(true)
            try {
                // Check if message is directed to AI
                const isAIMessage = message.toLowerCase().startsWith('@ai')
                if (isAIMessage) {
                    setIsWaitingForAI(true)
                }

                sendMessage('project-message', {
                    message,
                    sender: user
                })
                setMessages(prevMessages => [...prevMessages, { sender: user, message }])
                setMessage("")
            } finally {
                setIsLoading(false)
            }
        }
    }

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            send()
        }
    }

    // Write AI message
    function WriteAiMessage(message) {
        const messageObject = JSON.parse(message)
        return (
            <div className='overflow-auto bg-slate-950 text-white rounded-sm p-2'>
                <Markdown
                    children={messageObject.text}
                    options={{
                        overrides: {
                            code: SyntaxHighlightedCode,
                        },
                    }}
                />
            </div>
        )
    }

    // Initialize socket and fetch data
    useEffect(() => {
        initializeSocket(project._id)

        if (!webContainer) {
            getWebContainer().then(container => {
                setWebContainer(container)
                console.log("container started")
            })
        }

        receiveMessage('project-message', data => {
            console.log(data)
            if (data.sender._id === 'ai') {
                try {
                    const message = JSON.parse(data.message)
                    console.log(message)
                    webContainer?.mount(message.fileTree)
                    if (message.fileTree) {
                        setFileTree(message.fileTree || {})
                    }
                    setMessages(prevMessages => [...prevMessages, data])
                } finally {
                    setIsWaitingForAI(false)
                }
            } else {
                setMessages(prevMessages => [...prevMessages, data])
            }
        })

        axios.get(`/projects/get-project/${location.state.project._id}`).then(res => {
            console.log(res.data.project)
            setProject(res.data.project)
            setFileTree(res.data.project.fileTree || {})
        })

        axios.get('/users/all').then(res => {
            setUsers(res.data.users)
        }).catch(err => {
            console.log(err)
        })
    }, [])

    // Handle run button click
    const handleRunClick = async () => {
        if (!webContainer) return;
        setIsLoading(true)

        try {
            if (runProcess) {
                await runProcess.kill();
            }

            const serverContent = `
                const express = require('express');
                const app = express();
                const path = require('path');

                app.use(express.static('.'));

                app.get('*', (req, res) => {
                    res.sendFile(path.join(__dirname, 'index.html'));
                });

                app.listen(3000, () => {
                    console.log('Server running on port 3000');
                });
            `;

            const packageJson = {
                name: "web-project",
                version: "1.0.0",
                scripts: {
                    "start": "node server.js"
                },
                dependencies: {
                    "express": "^4.17.1"
                }
            };

            await webContainer.mount({
                ...fileTree,
                'server.js': {
                    file: { contents: serverContent }
                },
                'package.json': {
                    file: { contents: JSON.stringify(packageJson, null, 2) }
                }
            });

            const installProcess = await webContainer.spawn("npm", ["install"]);
           
            await new Promise(resolve => {
                installProcess.output.pipeTo(new WritableStream({
                    write(chunk) {
                        console.log(chunk);
                    }
                }));
                installProcess.exit.then(resolve);
            });

            const tempRunProcess = await webContainer.spawn("npm", ["start"]);

            tempRunProcess.output.pipeTo(new WritableStream({
                write(chunk) {
                    console.log(chunk);
                }
            }));

            setRunProcess(tempRunProcess);

            webContainer.on('server-ready', (port, url) => {
                console.log('Server ready at:', url);
                setIframeUrl(url);
                setActiveView('preview');
                setIsLoading(false);
            });
        } catch (error) {
            console.error('Error running project:', error);
            setIsLoading(false);
        }
    };

    // Save file tree
    const saveFileTree = (ft) => {
        axios.put('/projects/update-file-tree', {
            projectId: project._id,
            fileTree: ft
        }).then(res => {
            console.log(res.data)
        }).catch(err => {
            console.log(err)
        })
    }

    // Filter users based on search
    const filteredUsers = users.filter(user => 
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <main className='h-screen w-screen flex'>
            {/* Loading Overlay */}
            {isLoading && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <img src="https://media.giphy.com/media/swhRkVYLJDrCE/giphy.gif?cid=ecf05e47bhmsvy74igbj045xlonzrn3x6dcx7yblwf9j0bgz&ep=v1_gifs_search&rid=giphy.gif&ct=g" alt="Loading..." className="w-30 h-30" />
                </div>
            )}

            {/* Left Section */}
            <section className="left relative flex flex-col h-screen min-w-96 bg-slate-300">
                <header className='flex justify-between items-center p-2 px-4 w-full bg-slate-100 absolute z-10 top-0'>
                    <button className='flex gap-2' onClick={() => setIsModalOpen(true)}>
                        <i className="ri-add-fill mr-1"></i>
                        <p>Add collaborator</p>
                    </button>
                    <button onClick={() => setIsSidePanelOpen(!isSidePanelOpen)} className='p-2'>
                        <i className="ri-group-fill"></i>
                    </button>
                </header>
                
                {/* Conversation Area */}
                <div className="conversation-area pt-14 pb-10 flex-grow flex flex-col h-full relative">
                    <div ref={messageBox} className="message-box p-1 flex-grow flex flex-col gap-1 overflow-auto max-h-full scrollbar-hide">
                        {messages.map((msg, index) => (
                            <div
                                key={index}
                                className={`${
                                    msg.sender._id === 'ai' ? 'max-w-80' : 'max-w-52'
                                } ${msg.sender._id === user._id.toString() && 'ml-auto'} message flex flex-col p-2 bg-slate-50 w-fit rounded-md`}
                            >
                                <small className="opacity-65 text-xs">{msg.sender.email}</small>
                                <div className="text-sm">
                                    

{msg.image ? (
    <img src={msg.image} alt="Uploaded" className="max-w-full rounded-md" />
) : msg.sender._id === 'ai' ? (
    WriteAiMessage(msg.message)
) : (
    <p>{msg.message}</p>
)}
</div>
</div>
))}
</div>

{/* Input Field */}
<div className="inputField w-full flex absolute bottom-0">
<input
value={message}
onChange={(e) => setMessage(e.target.value)}
onKeyPress={handleKeyPress}
className='p-2 px-4 border-none outline-none flex-grow'
type="text"
placeholder={isWaitingForAI ? '🤖 AI is thinking...' : '🤖 For ai, use @ai'}
/>
<label className='px-5 bg-slate-800 text-white cursor-pointer flex items-center'>
<input
type="file"
accept="image/*"
onChange={handleImageUpload}
className="hidden"
/>
<i className="ri-image-add-fill"></i>
</label>
<button
onClick={handleMicClick}
className={`px-5 bg-slate-800 text-white ${isRecording ? 'bg-red-600' : ''}`}
>
<i className={`ri-mic-${isRecording ? 'fill' : 'line'}`}></i>
</button>
<button
onClick={send}
className='px-5 bg-slate-950 text-white'
disabled={isWaitingForAI}
>
{isWaitingForAI ? (
<i className="ri-loader-4-line animate-spin"></i>
) : (
<i className="ri-send-plane-fill"></i>
)}
</button>
</div>
</div>

{/* Side Panel */}
<div className={`sidePanel w-full h-full flex flex-col gap-2 bg-slate-50 absolute transition-all ${isSidePanelOpen ? 'translate-x-0' : '-translate-x-full'} top-0`}>
<header className='flex justify-between items-center px-4 p-2 bg-slate-200'>
<h1 className='font-semibold text-lg'>Collaborators</h1>
<button onClick={() => setIsSidePanelOpen(!isSidePanelOpen)} className='p-2'>
<i className="ri-close-fill"></i>
</button>
</header>
<div className="search-box px-4 py-2">
<input
type="text"
placeholder="Search users..."
value={searchQuery}
onChange={(e) => setSearchQuery(e.target.value)}
className="w-full p-2 rounded-md border border-slate-300 focus:outline-none focus:border-slate-500"
/>
</div>
<div className="users flex flex-col gap-2">
{project.users && filteredUsers.map(user => (
<div key={user._id} className="user cursor-pointer hover:bg-slate-200 p-2 flex gap-2 items-center">
<div className='aspect-square rounded-full w-fit h-fit flex items-center justify-center p-5 text-white bg-slate-600'>
<i className="ri-user-fill absolute"></i>
</div>
<h1 className='font-semibold text-lg'>{user.email}</h1>
</div>
))}
</div>
</div>
</section>

{/* Right Section */}
<section className="right bg-red-50 flex-grow h-full flex">
{/* File Explorer */}
<div className={`explorer h-full transition-all duration-300 ${isFileExplorerOpen ? 'max-w-64 min-w-52' : 'w-12'} bg-slate-200 relative`}>
<button
onClick={toggleFileExplorer}
className="absolute right-0 top-2 bg-slate-300 p-2 rounded-l z-10 hover:bg-slate-400 transition-colors"
>
<i className={`ri-arrow-${isFileExplorerOpen ? 'left' : 'right'}-line`}></i>
</button>
<div className={`p-2 mt-12 ${isFileExplorerOpen ? 'opacity-100' : 'opacity-0'}`}>
<button
onClick={() => {
const filename = prompt('Enter file name (e.g., index.html, styles.css, script.js):')
if (!filename) return

const defaultContents = {
'html': '<!DOCTYPE html>\n<html>\n<head>\n    <title>My Page</title>\n    <link rel="stylesheet" href="styles.css">\n</head>\n<body>\n    <h1>Hello World</h1>\n    <script src="script.js"></script>\n</body>\n</html>',
'css': '/* Add your styles here */\nbody {\n    margin: 0;\n    padding: 20px;\n    font-family: Arial, sans-serif;\n}',
'js': '// Add your JavaScript code here\nconsole.log("Script loaded!");'
}

const ext = filename.split('.').pop().toLowerCase()
const content = defaultContents[ext] || ''

const newFileTree = {
...fileTree,
[filename]: {
    file: { contents: content }
}
}
setFileTree(newFileTree)
saveFileTree(newFileTree)
setCurrentFile(filename)
setOpenFiles([...new Set([...openFiles, filename])])
}}
className="w-full p-2 bg-slate-300 hover:bg-slate-400 rounded"
>
New File
</button>
<div className="file-tree mt-4">
{Object.keys(fileTree).map((file, index) => (
<button
key={index}
onClick={() => {
    setCurrentFile(file)
    setOpenFiles([...new Set([...openFiles, file])])
}}
className="tree-element cursor-pointer p-2 px-4 flex items-center gap-2 hover:bg-slate-300 w-full text-left"
>
<p className='font-semibold text-lg'>{file}</p>
</button>
))}
</div>
</div>
</div>

{/* Code and Preview Section */}
<div className="flex-grow flex flex-col">
<div className="top flex justify-between w-full bg-slate-300 p-2">
<div className="files flex gap-2 overflow-x-auto flex-grow">
{openFiles.map((file) => (
<div
key={file}
className={`open-file cursor-pointer p-2 px-4 flex items-center w-fit gap-2 bg-slate-400 rounded-t ${currentFile === file ? 'bg-slate-500 text-white' : ''}`}
>
<button onClick={() => setCurrentFile(file)}>
    {file}
</button>
<button 
    onClick={(e) => {
        e.stopPropagation()
        handleCloseFile(file)
    }}
    className="ml-2 hover:text-red-500"
>
    <i className="ri-close-line"></i>
</button>
</div>
))}
</div>
<div className="actions flex gap-2 ml-2">
<button
onClick={() => setActiveView(activeView === 'code' ? 'preview' : 'code')}
className="p-2 px-4 bg-slate-500 text-white rounded hover:bg-slate-600"
>
{activeView === 'code' ? 'Show Preview' : 'Show Code'}
</button>
<button
onClick={handleRunClick}
className='p-2 px-4 bg-green-600 text-white rounded hover:bg-green-700'
>
Run
</button>
</div>
</div>

{/* Code Editor and Preview Toggle */}
<div className="flex-grow">
{activeView === 'code' ? (
<div className="code-editor-area h-full overflow-auto flex-grow bg-slate-50">
{currentFile && (
<pre className="hljs h-full">
    <code
        className={`hljs h-full outline-none language-${getFileLanguage(currentFile)}`}
        contentEditable
        suppressContentEditableWarning
        onBlur={(e) => {
            const updatedContent = e.target.innerText;
            const ft = {
                ...fileTree,
                [currentFile]: {
                    file: {
                        contents: updatedContent
                    }
                }
            };
            setFileTree(ft);
            saveFileTree(ft);

            if (webContainer) {
                webContainer.fs.writeFile(currentFile, updatedContent)
                    .catch(console.error);
            }
        }}
        dangerouslySetInnerHTML={{
            __html: fileTree[currentFile] ?
                hljs.highlight(
                    getFileLanguage(currentFile),
                    fileTree[currentFile].file.contents
                ).value : ''
        }}
        style={{
            whiteSpace: 'pre-wrap',
            paddingBottom: '25rem',
            counterSet: 'line-numbering',
            padding: '1rem'
        }}
    />
</pre>
)}
</div>
) : (
<div className="preview-area h-full">
{iframeUrl && webContainer ? (
<div className="flex flex-col h-full">
    <div className="address-bar">
        <input
            type="text"
            onChange={(e) => setIframeUrl(e.target.value)}
            value={iframeUrl}
            className="w-full p-2 px-4 bg-slate-200"
        />
    </div>
    <iframe
        src={iframeUrl}
        className="w-full h-full"
        sandbox="allow-forms allow-modals allow-pointer-lock allow-popups allow-same-origin allow-scripts allow-top-navigation"
    />
</div>
) : (
<div className="h-full flex items-center justify-center bg-slate-100">
    <p className="text-slate-500">Click "Run" to see the preview</p>
</div>
)}
</div>
)}
</div>
</div>
</section>

{/* Collaborator Modal */}
{isModalOpen && (
<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
<div className="bg-white p-4 rounded-md w-96 max-w-full relative">
<header className='flex justify-between items-center mb-4'>
<h2 className='text-xl font-semibold'>Select User</h2>
<button onClick={() => setIsModalOpen(false)} className='p-2'>
<i className="ri-close-fill"></i>
</button>
</header>
<div className="search-box mb-4">
<input
type="text"
placeholder="Search users..."
value={searchQuery}
onChange={(e) => setSearchQuery(e.target.value)}
className="w-full p-2 rounded-md border border-slate-300 focus:outline-none focus:border-slate-500"
/>
</div>
<div className="users-list flex flex-col gap-2 mb-16 max-h-96 overflow-auto">
{filteredUsers.map(user => (
<div
key={user._id}
className={`user cursor-pointer hover:bg-slate-200 ${Array.from(selectedUserId).includes(user._id) ? 'bg-slate-200' : ''} p-2 flex gap-2 items-center`}
onClick={() => handleUserClick(user._id)}
>
<div className='aspect-square relative rounded-full w-fit h-fit flex items-center justify-center p-5 text-white bg-slate-600'>
    <i className="ri-user-fill absolute"></i>
</div>
<h1 className='font-semibold text-lg'>{user.email}</h1>
</div>
))}
</div>
<button
onClick={addCollaborators}
className='absolute bottom-4 left-1/2 transform -translate-x-1/2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700'
>
Add Collaborators
</button>
</div>
</div>
)}
</main>
);
};

export default Project;