import React from 'react';
import Link from 'next/link';
import { Project } from '@/services/projectService';
import { Folder, Users, ChevronRight, Clock } from 'lucide-react';

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <Link href={`/project/${project._id}`} className="group">
      <div className="flex flex-col h-full bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md hover:border-indigo-400 transition-all">
        <div className="flex items-start justify-between mb-4">
          <div className="p-3 bg-indigo-50 rounded-lg group-hover:bg-indigo-100 transition-colors">
            <Folder className="h-6 w-6 text-indigo-600" />
          </div>
          <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
        </div>
        
        <h3 className="text-xl font-bold text-slate-900 mb-2 truncate">
          {project.name}
        </h3>
        
        <p className="text-sm text-slate-600 line-clamp-2 mb-6 flex-grow">
          {project.description || 'No description provided.'}
        </p>
        
        <div className="flex items-center justify-between pt-4 border-t border-slate-100 text-xs text-slate-500 font-medium">
          <div className="flex items-center gap-1.5">
            <Users className="h-4 w-4" />
            <span>{project.members.length} member{project.members.length !== 1 ? 's' : ''}</span>
          </div>
          
          <div className="flex items-center gap-1.5">
            <Clock className="h-4 w-4" />
            <span>{new Date(project.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
