import { useSupabaseQuery, useSupabaseMutation } from "@/hooks/useSupabase";
import { useAuth } from "@/components/AuthContext";
import { getVendorAccountKey } from "@/lib/vendorAccount";
import { 
    Search, 
    Send, 
    MoreVertical, 
    Phone, 
    Video, 
    Image as ImageIcon, 
    Paperclip, 
    Smile,
    MessageSquare,
    Check,
    CheckCircle,
    CheckCheck,
    ChevronLeft,
    Clock,
    User
} from "lucide-react";

export default function MessagesPage() {
    const { user } = useAuth();
    const vendorId = getVendorAccountKey(user);
    const [selectedRoomId, setSelectedRoomId] = useState(null);
    const [messageText, setMessageText] = useState("");
    const messagesEndRef = useRef(null);

    const { data: rooms = [] } = useSupabaseQuery('vendor_chat_rooms', (q) => 
        q.contains('participants', [vendorId]).order('last_message_at', { ascending: false })
    , [vendorId]);

    const { data: messages = [] } = useSupabaseQuery('vendor_chat_messages', (q) => 
        q.eq('room_id', selectedRoomId).order('created_at', { ascending: true })
    , [selectedRoomId]);

    const [sendMessage] = useSupabaseMutation('vendor_chat_messages', 'insert');
    const [updateRoom] = useSupabaseMutation('vendor_chat_rooms', 'update', (q, p) => q.eq('id', p.id));

    const selectedRoom = (rooms || []).find(r => r.id === selectedRoomId);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!messageText.trim() || !selectedRoomId) return;

        try {
            await sendMessage({
                room_id: selectedRoomId,
                sender_id: vendorId,
                text: messageText,
            });
            
            // Update last message in room
            await updateRoom({
                id: selectedRoomId,
                last_message: messageText,
                last_message_at: new Date().toISOString()
            });

            setMessageText("");
        } catch (error) {
            console.error("Failed to send message:", error);
        }
    };

    const formatTime = (ts) => {
        if (!ts) return "";
        return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="h-[calc(100vh-180px)] flex flex-col lg:flex-row gap-8 animate-in fade-in duration-700 pb-10">
            {/* Conversations List */}
            <div className={`lg:w-[400px] flex flex-col bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-2xl shadow-slate-200/50 transition-all ${selectedRoomId ? 'hidden lg:flex' : 'flex'}`}>
                <div className="p-8 border-b border-slate-50 space-y-6">
                    <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic">Client Inbox</h3>
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-pink-500 transition-colors" size={18} />
                        <input 
                            type="text" 
                            placeholder="Find a conversation..." 
                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3.5 pl-12 pr-6 text-sm text-slate-900 outline-none focus:bg-white focus:border-pink-500/50 transition-all placeholder:text-slate-300 font-bold" 
                        />
                    </div>
                </div>
                
                <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
                    {rooms.length > 0 ? rooms.map((room) => {
                        const otherParticipant = room.participants?.find(p => p !== vendorId);
                        const isActive = selectedRoomId === room.id;
                        return (
                            <button 
                                key={room.id}
                                onClick={() => setSelectedRoomId(room.id)}
                                className={`w-full p-5 rounded-[2rem] flex items-center space-x-5 transition-all group relative ${isActive ? 'bg-pink-50 border border-pink-100 shadow-inner' : 'hover:bg-slate-50 border border-transparent'}`}
                            >
                                <div className="relative">
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black border-2 transition-transform group-hover:scale-110 ${isActive ? 'bg-pink-500 text-white border-pink-400 shadow-xl shadow-pink-500/20' : 'bg-white text-slate-900 border-slate-100 shadow-sm'}`}>
                                        {otherParticipant?.charAt(0).toUpperCase() || <User size={24} />}
                                    </div>
                                    <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-4 border-white shadow-xl shadow-green-500/50"></span>
                                </div>
                                <div className="flex-1 text-left min-w-0">
                                    <div className="flex items-center justify-between">
                                        <p className={`text-sm font-black uppercase tracking-tight italic ${isActive ? 'text-pink-600' : 'text-slate-900'}`}>{otherParticipant}</p>
                                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{formatTime(room.last_message_at)}</span>
                                    </div>
                                    <p className="text-xs text-slate-500 truncate mt-1 font-medium italic">"{room.last_message || "Start a conversation..."}"</p>
                                </div>
                                {isActive && (
                                    <div className="absolute right-5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-pink-500 rounded-full animate-pulse"></div>
                                )}
                            </button>
                        );
                    }) : (
                        <div className="h-full flex flex-col items-center justify-center text-center p-10 space-y-6">
                            <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-200 shadow-inner">
                                <MessageSquare size={36} />
                            </div>
                            <p className="text-xs text-slate-400 font-black uppercase tracking-widest">No active chats</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Chat Area */}
            <div className={`flex-1 flex flex-col bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-2xl shadow-slate-200/50 transition-all ${!selectedRoomId ? 'hidden lg:flex' : 'flex'}`}>
                {selectedRoomId ? (
                    <>
                        {/* Chat Header */}
                        <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-white/80 backdrop-blur-xl sticky top-0 z-10 shadow-sm shadow-slate-200/20">
                            <div className="flex items-center space-x-5">
                                <button onClick={() => setSelectedRoomId(null)} className="lg:hidden p-3 text-slate-400 hover:text-pink-500 transition-colors bg-slate-50 rounded-xl">
                                    <ChevronLeft size={24} />
                                </button>
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-50 to-pink-100 text-pink-500 border border-pink-200 flex items-center justify-center font-black shadow-inner">
                                    {selectedRoom?.participants?.find(p => p !== vendorId)?.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <p className="text-lg font-black text-slate-900 italic tracking-tighter uppercase">{selectedRoom?.participants?.find(p => p !== vendorId)}</p>
                                    <div className="flex items-center space-x-2">
                                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                                        <span className="text-[10px] text-green-600 font-black uppercase tracking-[0.2em]">Active Now</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center space-x-3">
                                <button className="p-3.5 rounded-2xl bg-slate-50 text-slate-400 hover:text-pink-500 transition-all border border-slate-100 shadow-sm">
                                    <Phone size={20} />
                                </button>
                                <button className="p-3.5 rounded-2xl bg-slate-50 text-slate-400 hover:text-pink-500 transition-all border border-slate-100 shadow-sm">
                                    <Video size={20} />
                                </button>
                                <button className="p-3.5 rounded-2xl bg-slate-50 text-slate-400 hover:text-pink-500 transition-all border border-slate-100 shadow-sm">
                                    <MoreVertical size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-8 bg-slate-50/20">
                            {messages.map((msg, i) => {
                                const isMe = msg.sender_id === vendorId;
                                return (
                                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-${isMe ? 'right' : 'left'}-6 duration-400`}>
                                        <div className={`max-w-[70%] space-y-2 ${isMe ? 'items-end' : 'items-start'}`}>
                                            <div className={`px-6 py-4 rounded-[1.8rem] text-sm font-bold shadow-xl shadow-slate-200/20 ${
                                                isMe 
                                                    ? 'bg-gradient-to-br from-pink-500 to-purple-600 text-white rounded-br-none italic' 
                                                    : 'bg-white text-slate-900 border border-slate-100 rounded-bl-none italic'
                                            }`}>
                                                {msg.text}
                                            </div>
                                            <div className="px-3 flex items-center space-x-2">
                                                <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{formatTime(msg.created_at)}</span>
                                                {isMe && <CheckCheck size={14} className="text-pink-500" />}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-8 border-t border-slate-50 bg-white">
                            <form onSubmit={handleSend} className="flex items-end space-x-4">
                                <div className="flex-1 bg-slate-50 border border-slate-100 rounded-3xl flex items-end p-2.5 transition-all focus-within:bg-white focus-within:border-pink-500/50 focus-within:shadow-2xl focus-within:shadow-pink-500/5">
                                    <button type="button" className="p-3 text-slate-400 hover:text-pink-500 transition-colors">
                                        <Smile size={22} />
                                    </button>
                                    <textarea 
                                        rows="1"
                                        placeholder="Speak your mind..."
                                        value={messageText}
                                        onChange={(e) => setMessageText(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                handleSend(e);
                                            }
                                        }}
                                        className="flex-1 bg-transparent border-none outline-none py-3.5 px-3 text-sm text-slate-900 font-bold resize-none max-h-32 custom-scrollbar placeholder:text-slate-300"
                                    ></textarea>
                                    <button type="button" className="p-3 text-slate-400 hover:text-pink-500 transition-colors">
                                        <Paperclip size={22} />
                                    </button>
                                    <button type="button" className="p-3 text-slate-400 hover:text-pink-500 transition-colors">
                                        <ImageIcon size={22} />
                                    </button>
                                </div>
                                <button 
                                    type="submit"
                                    disabled={!messageText.trim()}
                                    className="p-5 rounded-3xl bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-2xl shadow-pink-500/40 hover:scale-110 active:scale-95 transition-all disabled:opacity-30 disabled:scale-100"
                                >
                                    <Send size={24} />
                                </button>
                            </form>
                            <div className="mt-6 flex items-center justify-center space-x-2">
                                <CheckCircle size={10} className="text-slate-300" />
                                <p className="text-[10px] text-slate-300 font-black uppercase tracking-[0.3em]">
                                    Secure Artist-Client Channel
                                </p>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-16 text-center space-y-10 bg-slate-50/30">
                        <div className="relative group">
                            <div className="absolute inset-0 bg-pink-500 blur-[80px] opacity-10 group-hover:opacity-20 transition-opacity"></div>
                            <div className="relative w-40 h-40 rounded-[3rem] bg-white border border-slate-100 flex items-center justify-center text-pink-500 shadow-2xl shadow-slate-200/50 group-hover:scale-110 transition-transform duration-700">
                                <MessageSquare size={72} strokeWidth={1} />
                            </div>
                        </div>
                        <div className="space-y-4 max-w-sm">
                            <h3 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">Ready to engage</h3>
                            <p className="text-sm text-slate-400 font-medium leading-relaxed">Select a conversation from the left to start coordinating with your clients. Fast responses build strong reputations.</p>
                        </div>
                        <div className="grid grid-cols-2 gap-6 w-full max-w-lg">
                            <div className="p-6 rounded-[2rem] bg-white border border-slate-100 text-left space-y-3 group hover:border-pink-200 transition-all shadow-xl shadow-slate-200/20">
                                <Clock size={24} className="text-purple-600" />
                                <p className="text-xs font-black text-slate-900 uppercase italic tracking-tight">Response Time</p>
                                <p className="text-[10px] text-slate-400 font-bold leading-relaxed">Reply within 30 minutes to stay in the priority list.</p>
                            </div>
                            <div className="p-6 rounded-[2rem] bg-white border border-slate-100 text-left space-y-3 group hover:border-pink-200 transition-all shadow-xl shadow-slate-200/20">
                                <CheckCircle size={24} className="text-pink-500" />
                                <p className="text-xs font-black text-slate-900 uppercase italic tracking-tight">Direct Access</p>
                                <p className="text-[10px] text-slate-400 font-bold leading-relaxed">Communicate and finalize all job details instantly.</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
