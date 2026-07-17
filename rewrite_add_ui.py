import re

with open('src/app/add/page.tsx', 'r') as f:
    content = f.read()

# Make sure we don't accidentally replace earlier parts. We'll split at `const inputClasses =`
parts = content.split('  const inputClasses =')
if len(parts) < 2:
    print("Could not find inputClasses")
    exit(1)

top_logic = parts[0]

# Change default state of selectedCategory from "none" to "password" if we are removing the dashboard
top_logic = top_logic.replace(
    'const [selectedCategory, setSelectedCategory] = useState<\n    "none" | "password" | "card" | "note"\n  >("none");',
    'const [selectedCategory, setSelectedCategory] = useState<"password" | "card" | "note">("password");'
)
# Update the local storage logic as well to fallback to password instead of none
top_logic = top_logic.replace(
    'if (savedCat && ["none", "password", "card", "note"].includes(savedCat)) {',
    'if (savedCat && ["password", "card", "note"].includes(savedCat)) {'
)
top_logic = top_logic.replace(
    'const handleCategoryChange = (val: "none" | "password" | "card" | "note") => {',
    'const handleCategoryChange = (val: "password" | "card" | "note") => {'
)

new_ui = """  const rowClasses = "flex flex-col sm:flex-row sm:items-center px-4 py-3 border-b border-slate-100 dark:border-white/5 last:border-0";
  const labelClasses = "w-full sm:w-1/3 text-xs sm:text-sm font-medium text-slate-500 sm:text-slate-700 dark:text-slate-400 sm:dark:text-slate-300 mb-1 sm:mb-0";
  const inputWrapperClasses = "flex-1 w-full flex items-center";
  const borderlessInputClasses = "flex-1 h-auto py-1 border-0 bg-transparent px-0 text-sm shadow-none focus-visible:ring-0 placeholder:text-slate-300 dark:placeholder:text-slate-600";
  const cardContainerClasses = "bg-white dark:bg-[#131b2f] rounded-2xl shadow-sm border border-slate-200/50 dark:border-white/[0.04] overflow-hidden mb-6";

  return (
    <div className="min-h-[calc(100vh-56px)] bg-slate-50/50 px-4 pt-6 pb-32 sm:min-h-[calc(100vh-60px)] sm:px-6 sm:pt-10 sm:pb-36 dark:bg-[#0a0e1a]">
      <div className="animate-in fade-in zoom-in-95 mx-auto w-full max-w-2xl duration-500">
        
        {/* Toggle Switch */}
        <div className="flex w-full max-w-sm mx-auto p-1 bg-slate-200/50 dark:bg-slate-800/50 rounded-full mb-8">
          <button 
            onClick={() => handleCategoryChange("password")} 
            className={`flex-1 text-sm font-medium py-2 rounded-full transition-all ${selectedCategory === 'password' ? 'bg-white dark:bg-[#0a0e1a] text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
          >
            Passwords
          </button>
          <button 
            onClick={() => handleCategoryChange("card")} 
            className={`flex-1 text-sm font-medium py-2 rounded-full transition-all ${selectedCategory === 'card' ? 'bg-white dark:bg-[#0a0e1a] text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
          >
            Cards
          </button>
          <button 
            onClick={() => handleCategoryChange("note")} 
            className={`flex-1 text-sm font-medium py-2 rounded-full transition-all ${selectedCategory === 'note' ? 'bg-white dark:bg-[#0a0e1a] text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
          >
            Notes
          </button>
        </div>

        {selectedCategory === "password" && (
          <div className="animate-in slide-in-from-right-4 fade-in duration-300">
            <h2 className="mb-4 text-xl font-bold text-slate-900 ml-2 dark:text-white">New Password</h2>
            <form onSubmit={handlePasswordSubmit}>
              <div className={cardContainerClasses}>
                <div className={rowClasses}>
                  <Label className={labelClasses}>Website URL</Label>
                  <div className={inputWrapperClasses}>
                    <Input placeholder="https://github.com" value={newPassword.website} onChange={(e) => setNewPassword({ ...newPassword, website: e.target.value })} required className={borderlessInputClasses} />
                  </div>
                </div>
                <div className={rowClasses}>
                  <Label className={labelClasses}>Username / Email</Label>
                  <div className={inputWrapperClasses}>
                    <Input placeholder="john@example.com" value={newPassword.username} onChange={(e) => setNewPassword({ ...newPassword, username: e.target.value })} required className={borderlessInputClasses} />
                  </div>
                </div>
                <div className={rowClasses}>
                  <Label className={labelClasses}>Password</Label>
                  <div className={inputWrapperClasses}>
                    <Input type={showPassword ? "text" : "password"} placeholder="••••••••" value={newPassword.password} onChange={(e) => setNewPassword({ ...newPassword, password: e.target.value })} required className={borderlessInputClasses} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                    <button type="button" onClick={generatePassword} className="p-2 text-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400" title="Generate strong password">
                      <RefreshCw className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="flex items-center px-4 pb-3">
                  <div className="w-full sm:w-1/3"></div>
                  <div className="flex-1 flex gap-1 mt-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className={`h-1 flex-1 rounded-full ${i <= strength ? getStrengthColor() : "bg-slate-200 dark:bg-slate-800"}`} />
                    ))}
                  </div>
                </div>
              </div>

              <div className={cardContainerClasses}>
                <div className={rowClasses}>
                  <Label className={labelClasses}>Tags</Label>
                  <div className={inputWrapperClasses}>
                    <Input placeholder="e.g. Work, Personal" value={newPassword.tags?.join(", ") || ""} onChange={(e) => setNewPassword({ ...newPassword, tags: e.target.value.split(",").map((t) => t.trimStart()) })} className={borderlessInputClasses} />
                  </div>
                </div>
                <div className={rowClasses + " items-start"}>
                  <Label className={labelClasses + " mt-2"}>Secure Note</Label>
                  <div className={inputWrapperClasses}>
                    <Textarea placeholder="Optional details..." value={newPassword.note} onChange={(e) => setNewPassword({ ...newPassword, note: e.target.value })} className={"min-h-[80px] " + borderlessInputClasses} />
                  </div>
                </div>
              </div>
              <Button type="submit" className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-lg shadow-emerald-500/20 text-base">
                Save Password
              </Button>
            </form>
          </div>
        )}

        {selectedCategory === "card" && (
          <div className="animate-in slide-in-from-right-4 fade-in duration-300">
            <h2 className="mb-4 text-xl font-bold text-slate-900 ml-2 dark:text-white">New Credit Card</h2>
            <form onSubmit={handleCardSubmit}>
              <div className={cardContainerClasses}>
                <div className={rowClasses}>
                  <Label className={labelClasses}>Card Title</Label>
                  <div className={inputWrapperClasses}>
                    <Input placeholder="e.g. My Chase Sapphire" value={newCard.name} onChange={(e) => setNewCard({ ...newCard, name: e.target.value })} required className={borderlessInputClasses} />
                  </div>
                </div>
                <div className={rowClasses}>
                  <Label className={labelClasses}>Card Type</Label>
                  <div className={inputWrapperClasses}>
                    <select value={newCard.cardType || "Visa"} onChange={(e) => setNewCard({ ...newCard, cardType: e.target.value })} required className={borderlessInputClasses + " w-full appearance-none outline-none dark:bg-transparent text-slate-700 dark:text-slate-200"}>
                      <option className="dark:bg-slate-900" value="Visa">Visa</option>
                      <option className="dark:bg-slate-900" value="Mastercard">Mastercard</option>
                      <option className="dark:bg-slate-900" value="Debit/Credit">Debit/Credit</option>
                      <option className="dark:bg-slate-900" value="Others">Others</option>
                    </select>
                  </div>
                </div>
                <div className={rowClasses}>
                  <Label className={labelClasses}>Card Number</Label>
                  <div className={inputWrapperClasses}>
                    <Input placeholder="XXXX XXXX XXXX XXXX" value={newCard.cardNumber} onChange={(e) => setNewCard({ ...newCard, cardNumber: e.target.value.replace(/\\D/g, "").slice(0, 16) })} required className={borderlessInputClasses} />
                  </div>
                </div>
                <div className={rowClasses}>
                  <Label className={labelClasses}>Expiry (MM/YY)</Label>
                  <div className={inputWrapperClasses}>
                    <Input placeholder="MM/YY" value={newCard.expiry} onChange={(e) => setNewCard({ ...newCard, expiry: formatExpiry(e.target.value) })} required maxLength={5} className={borderlessInputClasses} />
                  </div>
                </div>
                <div className={rowClasses}>
                  <Label className={labelClasses}>CVV</Label>
                  <div className={inputWrapperClasses}>
                    <Input placeholder="123" value={newCard.cvv} onChange={(e) => setNewCard({ ...newCard, cvv: e.target.value.replace(/\\D/g, "").slice(0, 4) })} required className={borderlessInputClasses} />
                  </div>
                </div>
              </div>

              <div className={cardContainerClasses}>
                <div className={rowClasses}>
                  <Label className={labelClasses}>Cardholder Name</Label>
                  <div className={inputWrapperClasses}>
                    <Input placeholder="Optional" value={newCard.serviceName} onChange={(e) => setNewCard({ ...newCard, serviceName: e.target.value })} className={borderlessInputClasses} />
                  </div>
                </div>
                <div className={rowClasses}>
                  <Label className={labelClasses}>Bank / Website</Label>
                  <div className={inputWrapperClasses}>
                    <Input placeholder="Optional" value={newCard.website} onChange={(e) => setNewCard({ ...newCard, website: e.target.value })} className={borderlessInputClasses} />
                  </div>
                </div>
                <div className={rowClasses}>
                  <Label className={labelClasses}>Tags</Label>
                  <div className={inputWrapperClasses}>
                    <Input placeholder="e.g. Finance, Shopping" value={newCard.tags?.join(", ") || ""} onChange={(e) => setNewCard({ ...newCard, tags: e.target.value.split(",").map((t) => t.trimStart()) })} className={borderlessInputClasses} />
                  </div>
                </div>
                <div className={rowClasses + " items-start"}>
                  <Label className={labelClasses + " mt-2"}>Secure Note</Label>
                  <div className={inputWrapperClasses}>
                    <Textarea placeholder="Optional details..." value={newCard.note} onChange={(e) => setNewCard({ ...newCard, note: e.target.value })} className={"min-h-[80px] " + borderlessInputClasses} />
                  </div>
                </div>
              </div>
              <Button type="submit" className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-500/20 text-base">
                Save Card
              </Button>
            </form>
          </div>
        )}

        {selectedCategory === "note" && (
          <div className="animate-in slide-in-from-right-4 fade-in duration-300">
            <h2 className="mb-4 text-xl font-bold text-slate-900 ml-2 dark:text-white">New Secure Note</h2>
            <form onSubmit={handleNoteSubmit}>
              <div className={cardContainerClasses}>
                <div className={rowClasses}>
                  <Label className={labelClasses}>Title</Label>
                  <div className={inputWrapperClasses}>
                    <Input placeholder="e.g. Recovery Phrase" value={newNote.title} onChange={(e) => setNewNote({ ...newNote, title: e.target.value })} required className={borderlessInputClasses} />
                  </div>
                </div>
                <div className={rowClasses + " items-start"}>
                  <Label className={labelClasses + " mt-2"}>Note Content</Label>
                  <div className={inputWrapperClasses}>
                    <Textarea placeholder="Write your secret..." value={newNote.content} onChange={(e) => setNewNote({ ...newNote, content: e.target.value })} required className={"min-h-[150px] " + borderlessInputClasses} />
                  </div>
                </div>
              </div>
              
              <div className={cardContainerClasses}>
                <div className={rowClasses}>
                  <Label className={labelClasses}>Tags</Label>
                  <div className={inputWrapperClasses}>
                    <Input placeholder="e.g. Crypto, Backup" value={newNote.tags?.join(", ") || ""} onChange={(e) => setNewNote({ ...newNote, tags: e.target.value.split(",").map((t) => t.trimStart()) })} className={borderlessInputClasses} />
                  </div>
                </div>
              </div>
              <Button type="submit" className="w-full h-12 bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-lg shadow-purple-500/20 text-base">
                Save Note
              </Button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
"""

with open('src/app/add/page.tsx', 'w') as f:
    f.write(top_logic + new_ui)

print("iOS Settings style redesign applied to /add/page.tsx successfully!")
